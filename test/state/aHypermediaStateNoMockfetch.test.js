
import { aTimeout, expect } from '@open-wc/testing';
import { clearStore, stateFactory } from '../../state/HypermediaState.js';
import { fetch } from '../../state/fetch.js';
import { observableTypes } from '../../state/observable/sirenObservableFactory.js';
import sinon from 'sinon/pkg/sinon-esm.js';

describe('should know when the tree has loaded', () => {
	function aGoodResponse(jsonResponse) {
		return {
			status: 200,
			ok: true,
			json: async() => jsonResponse
		};
	}

	const parentHref = 'pink';
	const subEntityFirst = `${parentHref}/sub1'`;
	const subEntityFirstSub = `${subEntityFirst}/sub2'`;
	const subEntitySecond = `${parentHref}/sub2'`;
	const primeLink = `${parentHref}/prime`;
	const primeLinkSubEntity = `${primeLink}/sub`;
	const delayFetchAmountMs = 100;
	let sandbox;

	before(async() => {
		const parentJson = {
			class: [ 'pink' ],
			properties: {
				answer: 42
			},
			entities: [{
				rel: [ 'first' ],
				href: subEntityFirst
			}, {
				rel: [ 'second' ],
				href: subEntitySecond
			}],
			links: [
				{ rel: [ 'self' ], href: parentHref },
				{ rel: [ 'prime' ], href: primeLink },
			]
		};

		const subEntityFirstJson = {
			properties: {
				answer: 43
			},
			entities: [{
				rel: [ 'third' ],
				href: subEntityFirstSub
			}],
			links: [
				{ rel: [ 'self' ], href: subEntityFirstSub },
			]
		};

		const subEntityFirstSubJson = {
			properties: {
				answer: 44
			},
			links: [
				{ rel: [ 'self' ], href: subEntityFirstSub },
			]
		};

		const subEntitySecondJson = {
			properties: {
				answer: 45
			},
			links: [
				{ rel: [ 'self' ], href: subEntitySecond },
			]
		};

		const primeLinkJson = {
			properties: {
				answer: 46
			},
			entities: [{
				rel: [ 'forth' ],
				href: primeLinkSubEntity
			}],
			links: [
				{ rel: [ 'self' ], href: primeLink },
			]
		};

		const primeLinkSubEntityJson = {
			properties: {
				answer: 47
			},
			links: [
				{ rel: [ 'self' ], href: primeLinkSubEntity },
				{ rel: [ 'prime' ], href: primeLink }
			]
		};

		const responses = {
			[parentHref]: aGoodResponse(parentJson),
			[subEntityFirst]: aGoodResponse(subEntityFirstJson),
			[subEntityFirstSub]: aGoodResponse(subEntityFirstSubJson),
			[subEntitySecond]: aGoodResponse(subEntitySecondJson),
			[primeLink]: aGoodResponse(primeLinkJson),
			[primeLinkSubEntity]: aGoodResponse(primeLinkSubEntityJson),
		};
		sandbox = sinon.createSandbox();
		sandbox.stub(window.d2lfetch, 'fetch')
			.callsFake(async(href) => {
				await aTimeout(delayFetchAmountMs); // lets cause a bit of a delay
				return responses[href];
			});
	});

	after(() => {
		sandbox.restore();
		clearStore();
	});

	beforeEach(() => {
		clearStore();
	});

	it('the parent state, should know when the children loaded', async() => {
		const state = await stateFactory(parentHref, 'token');
		const observable = {
			parentAnswer: {
				observable: observableTypes.property, id: 'answer'
			},
			subEntityFirstAnswer: {
				observable: observableTypes.property, id: 'answer',
				route: [{ observable: observableTypes.subEntity, rel: 'first' }]
			},
			subEntityFirstSubAnswer: {
				observable: observableTypes.property, id: 'answer',
				route: [
					{ observable: observableTypes.subEntity, rel: 'first' },
					{ observable: observableTypes.subEntity, rel: 'third' }
				]
			},
			subEntitySecondAnswer: {
				observable: observableTypes.property, id: 'answer',
				route: [{ observable: observableTypes.subEntity, rel: 'second' }]
			},
			primeLinkAnswer: {
				observable: observableTypes.property, id: 'answer',
				route: [{ observable: observableTypes.link, rel: 'prime' }]
			},
			primeLinkSubEntityAnswer: {
				observable: observableTypes.property, id: 'answer',
				route: [
					{ observable: observableTypes.link, rel: 'prime' },
					{ observable: observableTypes.subEntity, rel: 'forth' }
				]
			},
			primeLinkSubEntityBackToPrimeLinkAnswer: {
				observable: observableTypes.property, id: 'answer',
				route: [
					{ observable: observableTypes.link, rel: 'prime' },
					{ observable: observableTypes.subEntity, rel: 'forth' },
					{ observable: observableTypes.link, rel: 'prime' }
				]
			}
		};
		const observer = {};
		state.addObservables(observer, observable);

		const timeBeforeFetch = Date.now();
		fetch(state);
		await state.allFetchesComplete();
		const timeAfterFetch = Date.now();
		const depthOfResponses = 3;
		const maxDelay = delayFetchAmountMs * depthOfResponses;
		expect(observer.parentAnswer).to.equal(42);
		expect(observer.subEntityFirstAnswer).to.equal(43);
		expect(observer.subEntityFirstSubAnswer).to.equal(44);
		expect(observer.subEntitySecondAnswer).to.equal(45);
		expect(observer.primeLinkAnswer).to.equal(46);
		expect(observer.primeLinkSubEntityAnswer).to.equal(47);
		expect(timeAfterFetch - timeBeforeFetch).to.be.above(maxDelay);
	});
});
