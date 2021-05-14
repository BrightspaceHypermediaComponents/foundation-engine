
import { assert, expect } from '@open-wc/testing';
import { clearStore, dispose, processRawJsonSirenEntity, stateFactory } from '../../state/HypermediaState.js';
import { fetch } from '../../state/fetch.js';
import { FetchError } from '../../state/Fetchable.js';
import fetchMock from 'fetch-mock/esm/client.js';
import { myLoadingPromise } from '../../state/loading.js';
import { observableTypes } from '../../state/observable/sirenObservableFactory.js';
import sinon from 'sinon/pkg/sinon-esm.js';
import { SirenFacade } from '../../state/observable/SirenFacade.js';
import SirenParse from 'siren-parser';
import { waitUntil } from '@open-wc/testing-helpers';

function uniqueId() {
	return `${Date.now()}`;
}

function wait(condition, message = condition.toString()) {
	const options = { interval: 3, timeout: 10 };
	return waitUntil(condition, message, options);
}

function assertAreSimilar(actual, expected) {
	// converting object to json and then parsing in again leave only comparable properties.
	assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)));
}

describe('HypermediaState class', () => {
	describe('constructor', () => {
		it('can create HypermediaState object', async() => {
			const id = uniqueId();
			const token = 'token';
			const state = await stateFactory(id, token);
			assert.equal(state.entityID, id);
			assert.equal(state.href, id);
			assert.equal(state.token, token);
		});
	});

	describe('addObservables and setSirenEntity methods', () => {

		it('should create correct observable type and assign values to observer', async() => {

			const observer = {};
			const entityHref = `http://entity-${uniqueId()}`;
			const state = await stateFactory(entityHref, 'token');
			const selfHref = entityHref;
			const nextHref = `${selfHref}/next`;
			const entity = {
				class: [ 'foo-class-1', 'foo-class-2' ],
				properties: {
					name: 'entity-name',
					description: 'entity-description'
				},
				entities: [
					{
						class: [ 'foo-sub-class' ],
						rel: [ 'sub1', 'item' ]
					},
					{
						class: [ 'foo-sub-entity-2' ],
						rel: [ 'sub2', 'item' ],
					}
				],
				actions: [
					{
						href: `${selfHref}/put/`,
						name: 'do-put',
						method: 'PUT',
						fields: [{ type: 'hidden', name: 'field-name', value: 'field-value' }],
						type: 'application/x-www-form-urlencoded'
					},
					{
						href: `${selfHref}/get/`,
						name: 'do-get',
						method: 'GET',
						fields: [],
						type: 'application/x-www-form-urlencoded'
					}
				],
				links: [
					{ rel: [ 'next' ], href: nextHref },
					{ rel: [ 'self' ], href: selfHref }
				]
			};
			const observables = {
				class: { observable: observableTypes.classes },
				name: { observable: observableTypes.property },
				description: { observable: observableTypes.property },
				subEntity1: { observable: observableTypes.subEntity, rel: 'sub1' },
				subEntity2: { observable: observableTypes.subEntity, rel: 'sub2' },
				actionPut: { observable: observableTypes.action, name: 'do-put' },
				actionGet: {  observable: observableTypes.action, name: 'do-get' },
				linkNext: { observable: observableTypes.link, rel: 'next' },
				linkSelf: { observable: observableTypes.link, rel: 'self' },
				subEntities: { observable: observableTypes.subEntities, rel: 'item' },
				entity: { observable: observableTypes.entity }
			};

			state.addObservables(observer, observables);
			await state.setSirenEntity(SirenParse(JSON.stringify(entity)));

			assert.deepEqual(observer.class, entity.class);
			assert.deepEqual(observer.name, entity.properties.name);
			assert.deepEqual(observer.description, entity.properties.description);
			assertAreSimilar(observer.subEntity1, new SirenFacade(entity.entities[0]));
			assertAreSimilar(observer.subEntity2, new SirenFacade(entity.entities[1]));
			assertAreSimilar(observer.actionGet, { has: true });
			assertAreSimilar(observer.actionPut, { has: true });
			assert.equal(observer.linkNext, entity.links[0].href);
			assert.equal(observer.linkSelf, entity.links[1].href);
			assertAreSimilar(observer.entity, entity);
		});

		it('observable with route', async() => {
			const observable = {
				mainEntityClass: { observable: observableTypes.classes },
				linkedEntityProperty: {
					observable: observableTypes.property,
					route: [
						{ observable: observableTypes.link, rel: 'linked'  }
					]
				},
				selflessSubEntityProperty: {
					observable: observableTypes.property,
					route: [
						{ observable: observableTypes.subEntity, rel: 'selfless-subEntity-rel' }
					]
				}
			};

			const entityHref = `http://entity-${uniqueId()}`;
			const linkedHref = `${entityHref}/linked`;
			const observer = {};

			const entity = {
				class: ['main-entity-class'],
				entities: [{
					class: ['selfless-subEntity-class'],
					rel: [ 'selfless-subEntity-rel' ],
					properties: { selflessSubEntityProperty: 'selfless-subEntity-name' }
				}],
				links: [{ rel: [ 'linked' ], href: linkedHref }, { rel:['self'], href: entityHref }]
			};
			const linkedEntity = {
				class: ['linked-entity-class'],
				properties: { linkedEntityProperty: 'linked-entity-name' },
				links: [{ rel:['self'], href: linkedHref }]
			};

			const state = await stateFactory(entityHref, 'token');
			const mock = fetchMock
				.mock(entityHref, JSON.stringify(entity))
				.mock(linkedHref, JSON.stringify(linkedEntity));

			state.addObservables(observer, observable);

			fetch(state);
			await state.allFetchesComplete();

			assert.isTrue(mock.called(entityHref));
			assert.isTrue(mock.called(linkedHref));
			assert.deepEqual(observer, {
				mainEntityClass: ['main-entity-class'],
				linkedEntityProperty: 'linked-entity-name',
				selflessSubEntityProperty: 'selfless-subEntity-name'
			}, 'class should be observed from main entity and property should be fetched from linked entity');
		});

		it('mutates the observed value with method', async() => {
			const observer = {};
			const observable = {
				value: { observable: observableTypes.property, method: (x) => { observer.sqrt = x * x; return x;} }
			};
			const entity = {
				properties: {
					value: 2
				}
			};

			const state = await stateFactory(uniqueId(), 'bar');
			state.addObservables(observer, observable);
			state.setSirenEntity(SirenParse(JSON.stringify(entity)));
			assert.deepEqual(observer, { sqrt: 4, value: 2 });
		});

		it('addObservables after setSirenEntity', async() => {
			const observable = {
				classes: { observable: observableTypes.classes }
			};
			const entity = {
				class: ['class1']
			};
			const observer = {};
			const state = await stateFactory(uniqueId(), 'bar');
			state.setSirenEntity(SirenParse(JSON.stringify(entity)));
			state.addObservables(observer, observable);
			assert.deepEqual(observer, { classes: entity.class });
		});

		it('can call setSirenEntity without parameter', async() => {
			const state = await stateFactory(uniqueId(), 'bar');
			const observable = {
				classes: { type: Array, observable: observableTypes.classes }
			};
			const observer = { classes: [] };
			const entity = {
				class:['foo']
			};
			state.addObservables(observer, observable);
			state.setSirenEntity(SirenParse(JSON.stringify(entity)));
			assert.deepEqual(observer, { classes: ['foo'] });

			observer.classes.shift();
			assert.deepEqual(observer, { classes: [] });
			const stateEntityBefore = state._entity;
			state.setSirenEntity();
			const stateEntityAfter = state._entity;
			assert.equal(stateEntityBefore, stateEntityAfter);
		});

		it('observer should recieve updates when siren entity is updated', async() => {
			const observable = {
				classes: { observable: observableTypes.classes }
			};
			const entity = {
				class: ['class1']
			};
			const updatedEntity = {
				class: ['class1', 'class2']
			};
			const observer = {};
			const state = await stateFactory(uniqueId(), 'bar');
			state.addObservables(observer, observable);
			state.setSirenEntity(SirenParse(JSON.stringify(entity)));
			assert.deepEqual(observer, { classes: entity.class });
			state.setSirenEntity(SirenParse(JSON.stringify(updatedEntity)));
			assert.deepEqual(observer, { classes: updatedEntity.class });
		});

		it('setSirentEntity - should not continue if entity has href property', async() => {
			const entityWithHref = {
				href: 'foo'
			};
			const state = await stateFactory(uniqueId(), 'bar');
			state.setSirenEntity(entityWithHref);
			const spy = sinon.spy(state._decodedEntity);
			assert.isTrue(spy.forEach.notCalled);
		});
	});

	describe('createRoutedState method', () => {
		it('can create new state by calling state.createRoutedState ', async() => {
			const state = await stateFactory(uniqueId(), 'bar');
			const anotherState = await state.createRoutedState('anotherFoo', 'anotherBar');
			assert.equal(anotherState.entityID, 'anotherFoo');
			assert.equal(anotherState.token, 'anotherBar');
		});
	});

	describe('dispose method', () => {
		it('disposed observer does not recieve updates', async() => {
			const observable = {
				classes: { observable: observableTypes.classes }
			};
			const entity = {
				class: ['class1']
			};
			const updatedEntity = {
				class: ['class1', 'class2']
			};
			const observer = {};
			const state = await stateFactory(uniqueId(), 'bar');
			state.addObservables(observer, observable);
			state.setSirenEntity(SirenParse(JSON.stringify(entity)));
			assert.deepEqual(observer, { classes: entity.class });
			state.dispose(observer);
			state.setSirenEntity(SirenParse(JSON.stringify(updatedEntity)));
			assert.notDeepEqual(observer, { classes: updatedEntity.class });
			assert.deepEqual(observer, { classes: entity.class });
		});
	});

	describe('handleCachePriming method', () => {
		beforeEach(() => {
			fetchMock.reset();
		});

		it('Should create state per link and fetch data', async() => {
			const link1 = `http://link1-${uniqueId()}`;
			const link2 = `http://link2-${uniqueId()}`;
			const mockLink = fetchMock
				.mock(link1, {})
				.mock(link2, {});
			const state = await stateFactory(uniqueId(), 'bar');
			assert.isFalse(window.D2L.Foundation.StateStore.get(link1, 'bar'));
			assert.isFalse(window.D2L.Foundation.StateStore.get(link2, 'bar'));
			await state.handleCachePriming([link1, link2]);
			assert.isTrue(mockLink.called(link1));
			assert.isTrue(mockLink.called(link2));
			assert.equal(window.D2L.Foundation.StateStore.get(link1, 'bar').entityID, link1);
			assert.equal(window.D2L.Foundation.StateStore.get(link2, 'bar').entityID, link2);
		});

		it('should create state per link and throw FetchError on error', async() => {
			const link1 = `http://link1-${uniqueId()}`;
			const link2 = `http://link2-${uniqueId()}`;
			const mockLink = fetchMock
				.mock(link1, 500)
				.mock(link2, {});
			const state = await stateFactory(uniqueId(), 'bar');
			assert.isFalse(window.D2L.Foundation.StateStore.get(link1, 'bar'));
			assert.isFalse(window.D2L.Foundation.StateStore.get(link2, 'bar'));
			let processingError;
			try {
				await state.handleCachePriming([link1, link2]);
			} catch (e) {
				processingError = e;
			}

			assert.instanceOf(processingError, FetchError);
			assert.isTrue(mockLink.called(link1));
			assert.isTrue(mockLink.called(link2));

			assert.equal(window.D2L.Foundation.StateStore.get(link1, 'bar').entityID, link1);
			assert.equal(window.D2L.Foundation.StateStore.get(link2, 'bar').entityID, link2);
		});

	});

	describe('hasServerResponseCached method', () => {
		it('returns false when entity is not set', async() => {
			const state = await stateFactory(uniqueId(), 'bar');
			const isCached = state.hasServerResponseCached();
			assert.isFalse(isCached);
		});

		it('returns true when entity is set', async() => {
			const state = await stateFactory(uniqueId(), 'bar');
			state.setSirenEntity(SirenParse(JSON.stringify({ class: ['foo'] })));
			const isCached = state.hasServerResponseCached();
			assert.isTrue(isCached);
		});

		it('returns true after entity is reset', async() => {
			const state = await stateFactory(uniqueId(), 'bar');
			state.setSirenEntity(SirenParse(JSON.stringify({ class: ['foo'] })));
			assert.isTrue(state.hasServerResponseCached());
			state.reset();
			assert.isTrue(state.hasServerResponseCached());
		});
	});

	describe('push and reset methods', () => {
		let state, putActionSpy, getActionSpy, subEntityRoutedStateSpy, linkPrimeRoutedStateSpy;
		before(async() => {
			const entityHref = `http://entity-${uniqueId()}`;
			const subEntity = `${entityHref}/sub1'`;
			const primeLink = `${entityHref}/prime`;
			fetchMock
				.mock(subEntity, {})
				.mock(primeLink, {});
			const observable = {
				actionPut: { observable: observableTypes.action, name: 'do-put' },
				linkPrime: { observable: observableTypes.link, rel: 'prime', prime: true },
				subEntity: { observable: observableTypes.subEntity, rel: 'item', route: [{ abc: 'need route to pass token to ' }] }
			};
			const entity = {
				class:['aClass'],
				entities: [{
					class: [ 'sub-class' ],
					rel: [ 'item' ],
					href: subEntity
				}],
				actions: [
					{
						href: `${entityHref}/put/`,
						name: 'do-put',
						method: 'PUT',
						fields: [{ type: 'hidden', name: 'field-name', value: 'field-value' }],
						type: 'application/x-www-form-urlencoded'
					},
					{
						href: `${entityHref}/get/`,
						name: 'do-get',
						method: 'GET',
						fields: [],
						type: 'application/x-www-form-urlencoded'
					}
				],
				links: [{ rel: [ 'self' ], href: entityHref }, { rel: [ 'prime' ], href: primeLink }]
			};

			state = await stateFactory(entityHref, 'token');
			const observer = {};

			state.addObservables(observer, observable);
			state.setSirenEntity(SirenParse(JSON.stringify(entity)));

			// create spies for observables
			const putActionObservable = state._getSirenObservable({ type: observableTypes.action, id: 'do-put' });
			const getActionObservable = state._getSirenObservable({ type: observableTypes.action, id: 'do-get' });
			const linkPrimeObservable = state._getSirenObservable({ type: observableTypes.link, id: 'prime' });
			const subEntityObservable = state._getSirenObservable({ type: observableTypes.subEntity, id: 'item' });
			await wait(() => putActionObservable !== undefined);
			await wait(() => getActionObservable !== undefined);
			await wait(() => linkPrimeObservable !== undefined);
			await wait(() => subEntityObservable !== undefined);
			putActionSpy = sinon.spy(putActionObservable);
			getActionSpy = sinon.spy(getActionObservable);
			subEntityRoutedStateSpy = sinon.spy(subEntityObservable.routedState);
			linkPrimeRoutedStateSpy = sinon.spy(linkPrimeObservable.routedState);
		});

		after(() => {
			fetchMock.reset();
		});

		const methods = ['push', 'reset'];
		methods.forEach((method) => {
			it(`should call ${method} method for routedStates and for action observables`, async() => {
				// push or reset state
				await state[method]();

				//verify shild states where pushed or reset
				await wait(() => subEntityRoutedStateSpy[method].calledOnce);
				await wait(() => linkPrimeRoutedStateSpy[method].calledOnce);

				// verify entity actions where pushed or reset
				await wait(() => putActionSpy[method].calledOnce);
				await wait(() => getActionSpy[method].calledOnce);
			});

		});
	});

	describe('updateProperties method', () => {

		it('should update observable value property', async() => {
			const state = await stateFactory(uniqueId(), 'bar');
			const observables = {
				description: { observable: observableTypes.property }
			};
			const observer = {};
			state.addObservables(observer, observables);
			const observablObj = state._getSirenObservable({ type: observableTypes.property, id: 'description' });
			assert.isUndefined(observablObj.value);
			observables.description.value = 'abc';
			state.updateProperties(observables);
			assert.equal(observablObj.value, 'abc');
			assert.deepEqual(observer, { description: 'abc' });
		});

		it('should not update observable type that is not supported', async() => {
			const state = await stateFactory(uniqueId(), 'bar');
			const observables = {
				classes: { type: Array, observable: 'unupported' }
			};
			const observer = {};
			state.addObservables(observer, observables);
			const spy = sinon.spy(state);
			state.updateProperties(observables);
			assert.isTrue(spy._getSirenObservable.notCalled, 'should return before calling _getSirenObservable');
		});
	});

	describe('processRawJsonSirenEntity method', () => {
		it('should create state with passed token', async() => {
			const tokenForNewState = 'token';
			const state = await stateFactory(uniqueId(), 'bar');
			const href = `http://foo-${uniqueId()}`;
			assert.isFalse(window.D2L.Foundation.StateStore.get(href, tokenForNewState), 'state should not exist yet');
			const json = `{
				"class": [ "foo" ],
				"properties": {
					"bar": 42
				},
				"entities": [
					{
					"class": [ "sub-foo" ],
					"rel": [ "self" ],
					"href": "http://foo/sub"
					}
				],
				"actions": [
				],
				"links": [
					{ "rel": [ "self" ], "href": "${href}" }
				]
				}`;
			await state.processRawJsonSirenEntity(json, tokenForNewState);
			const newState = window.D2L.Foundation.StateStore.get(href, tokenForNewState);
			assert.equal(newState.entityID, href);
			assert.equal(newState.token, tokenForNewState);
		});

		it('should create state with existing token', async() => {
			const state = await stateFactory(uniqueId(), 'bar');
			const rawToken = 'bar';
			const href = `http://foo-${uniqueId()}`;
			assert.isFalse(window.D2L.Foundation.StateStore.get(href, rawToken), 'state should not exist yet');
			const json = `{
				"class": [ "foo" ],
				"properties": {
					"bar": 42
				},
				"entities": [
					{
					"class": [ "sub-foo" ],
					"rel": [ "self" ],
					"href": "http://foo/sub"
					}
				],
				"actions": [
				],
				"links": [
					{ "rel": [ "self" ], "href": "${href}" }
				]
				}`;
			await state.processRawJsonSirenEntity(json);
			const newState = window.D2L.Foundation.StateStore.get(href, rawToken);
			assert.equal(newState.entityID, href);
			assert.equal(newState.token.rawToken, rawToken);
		});
	});

	describe('should know when the tree has loaded', () => {
		const parentHref = 'http://pink';
		const subEntityFirst = `${parentHref}/sub1`;
		const subEntityFirstSub = `${subEntityFirst}/sub`;
		const subEntitySecond = `${parentHref}/sub2`;
		const primeLink = `${parentHref}/prime`;
		const primeLinkSubEntity = `${primeLink}/sub`;
		const delayFetchAmountMs = 50;
		let observable;

		beforeEach(async() => {
			observable = {
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
			const parentJson = JSON.stringify({
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
			});

			const subEntityFirstJson = JSON.stringify({
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
			});

			const subEntityFirstSubJson = JSON.stringify({
				properties: {
					answer: 44
				},
				links: [
					{ rel: [ 'self' ], href: subEntityFirstSub },
				]
			});

			const subEntitySecondJson = JSON.stringify({
				properties: {
					answer: 45
				},
				links: [
					{ rel: [ 'self' ], href: subEntitySecond },
				]
			});

			const primeLinkJson = JSON.stringify({
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
			});

			const primeLinkSubEntityJson = JSON.stringify({
				properties: {
					answer: 47
				},
				links: [
					{ rel: [ 'self' ], href: primeLinkSubEntity },
					{ rel: [ 'prime' ], href: primeLink }
				]
			});
			const option = { delay: delayFetchAmountMs };
			await fetchMock
				.mock(parentHref, parentJson, option)
				.mock(subEntityFirst, subEntityFirstJson, option)
				.mock(subEntityFirstSub, subEntityFirstSubJson, option)
				.mock(subEntitySecond, subEntitySecondJson, option)
				.mock(primeLink, primeLinkJson, option)
				.mock(primeLinkSubEntity, primeLinkSubEntityJson, option);

		});

		afterEach(async() => {
			clearStore();
			fetchMock.reset();
		});

		it('the parent state, should know when the children loaded', async() => {
			const state = await stateFactory(parentHref, 'token');
			const observer = {};
			state.addObservables(observer, observable);

			const timeBeforeFetch = Date.now();
			fetch(state);
			await myLoadingPromise(state);
			const timeAfterFetch = Date.now();
			const depthOfResponses = 3;
			const maxDelay = delayFetchAmountMs * depthOfResponses;
			expect(observer.parentAnswer).to.equal(42);
			expect(observer.subEntityFirstAnswer).to.equal(43);
			expect(observer.subEntityFirstSubAnswer).to.equal(44);
			expect(observer.subEntitySecondAnswer).to.equal(45);
			expect(observer.primeLinkAnswer).to.equal(46);
			expect(timeAfterFetch - timeBeforeFetch).to.be.above(maxDelay);
		});

		it('the child state, should know when the parent and it\'s children have loaded', async() => {
			const state = await stateFactory(parentHref, 'token');
			const observer = {};
			state.addObservables(observer, observable);

			const aChildState = await stateFactory(subEntityFirstSub, 'token');
			const childObservable = {
				answer: {
					observable: observableTypes.property, id: 'answer'
				}
			};
			const childObserver = {};
			aChildState.addObservables(childObserver, childObservable);

			const timeBeforeFetch = Date.now();
			fetch(state);
			await myLoadingPromise(aChildState);
			const timeAfterFetch = Date.now();
			const depthOfResponses = 3;
			const maxDelay = delayFetchAmountMs * depthOfResponses;
			expect(observer.parentAnswer).to.equal(42);
			expect(observer.subEntityFirstAnswer).to.equal(43);
			expect(observer.subEntityFirstSubAnswer).to.equal(44);
			expect(childObserver.answer).to.equal(44);
			expect(observer.subEntitySecondAnswer).to.equal(45);
			expect(observer.primeLinkAnswer).to.equal(46);
			expect(observer.primeLinkSubEntityAnswer).to.equal(47);
			expect(timeAfterFetch - timeBeforeFetch).to.be.above(maxDelay);
		});
	});
});

describe('stateFactory function', () => {
	it('can create state and add it to the window.D2L.Foundation.StateStore', async() => {
		const id = uniqueId();
		const state = await stateFactory(id, 'bar');
		assert.equal(state.entityID, id);
		const stateInStore = window.D2L.Foundation.StateStore.get(id, 'bar');
		assert.equal(state, stateInStore);
	});

	it('Should not create new state object for same entity/token if state already exists', async() => {
		const id = uniqueId();
		const state = await stateFactory(id, 'bar');
		assert.equal(state.entityID, id);
		const state2 = await stateFactory(id, 'bar');
		assert.equal(state, state2);
	});

	it('should create 2 different states for same entityId and different tokens', async() => {
		const id = uniqueId();
		const state = await stateFactory(id, 'bar');
		assert.equal(state.entityID, id);
		const stateInStore = window.D2L.Foundation.StateStore.get(id, 'bar');
		assert.equal(state, stateInStore);
		const state2 = await stateFactory(id, 'bar2');
		assert.equal(state2.entityID, id);
		const stateInStore2 = window.D2L.Foundation.StateStore.get(id, 'bar2');
		assert.equal(state2, stateInStore2);
		assert.notEqual(state, state2);
	});
});

describe('processRawJsonSirenEntity function', () => {

	it('should parse json and add entity to store', async() => {
		const href = `http://foo-${uniqueId()}`;
		assert.isFalse(window.D2L.Foundation.StateStore.get(href, 'token'), 'state should not exist yet');
		const json = `{
			"class": [ "foo" ],
			"properties": {
				"bar": 42
			},
			"entities": [{
				"class": [ "sub-foo" ],
				"rel": [ "self" ],
				"href": "http://foo/sub"
			}],
			"actions": [
			],
			"links": [{ "rel": [ "self" ], "href": "${href}" }]
		}`;
		await processRawJsonSirenEntity(json, 'token');
		const state = window.D2L.Foundation.StateStore.get(href, 'token');
		assert.equal(state.entityID, href, 'state with expected href should be created');
	});

	it('should not create state for selfless entity', async() => {
		const href = `http://foo-${uniqueId()}`;
		assert.isFalse(window.D2L.Foundation.StateStore.get(href, 'token', 'state should not exist yet'));
		const json = `{
			"class": [ "foo" ],
			"properties": {
				"bar": 42
			},
			"entities": [{
				"class": [ "sub-foo" ],
				"rel": [ "self" ],
				"href": "http://foo/sub"
			}],
			"actions": [],
			"links": [{ "rel": [ "not-my-self-today" ], "href": "${href}" }]
		}`;
		await processRawJsonSirenEntity(json, 'token');
		assert.isFalse(window.D2L.Foundation.StateStore.get(href, 'token'), 'state should not be created');
	});
});

describe('dispose function', () => {
	it('can dispose state', async() => {
		const state = await stateFactory(uniqueId(), 'token');
		const observable = {
			classes: { type: Array, observable: observableTypes.classes }
		};
		const observer = { classes: [] };
		state.addObservables(observer, observable);
		const spy = sinon.spy(state);
		dispose(state, observer);
		assert.isTrue(spy.dispose.called);
	});
});

describe('fetch integration test', () => {
	beforeEach(() => {
		fetchMock.reset();
	});

	it('fetch(state) should use state.href to get entity and apply it to the state', async() => {
		const selfHref = `http://foo-${uniqueId()}`;
		const nextHref = `${selfHref}/next`;
		const entity = {
			class: [ 'foo-class' ],
			properties: {
				bar: 42
			},
			entities: [
				{
					class: [ 'foo-sub-entity-1' ],
					rel: [ 'sub1' ],
					href: 'http://foo/sub1'
				},
				{
					class: [ 'foo-sub-entity-2' ],
					rel: [ 'sub2' ],
					href: 'http://foo/sub2'
				}
			],
			actions: [
				{
					href: 'http://api.x.io/do/put/',
					name: 'do-put',
					method: 'PUT',
					fields: [{ type: 'hidden', name: 'field-name', value: 'field-value' }]
				}
			],
			links: [
				{ rel: [ 'next' ], href: nextHref },
				{ rel: [ 'self' ], href: selfHref }
			]
		};
		const mock = fetchMock
			.mock(selfHref, JSON.stringify(entity));

		const state = await stateFactory(selfHref, 'token');
		const observable = {
			class: { type: Array, observable: observableTypes.classes },
			bar: { type: Number, observable: observableTypes.property }
		};
		const observer = {};
		state.addObservables(observer, observable);
		const spy = sinon.spy(state);
		await fetch(state);

		await wait(() => mock.called(selfHref));
		await wait(() => spy.onServerResponse.called);
		await wait(() => spy.setSirenEntity.called);
		assert.deepEqual(observer.class, entity.class);
		assert.deepEqual(observer.name, entity.properties.name);
	});

	it('FetchError should be thown and setSirenEntity should not be called', async() => {
		const selfHref = `http://foo-${uniqueId()}`;
		const mock = fetchMock
			.mock(selfHref, 500);

		const state = await stateFactory(selfHref, 'token');
		const spy = sinon.spy(state);
		let processingError;
		try {
			await fetch(state);
		} catch (e) {
			processingError = e;
		}
		await wait(() => mock.called(selfHref));
		await wait(() => spy.onServerResponse.called);
		assert.instanceOf(processingError, FetchError, 'should thow FetchError object');
		assert.isTrue(spy.setSirenEntity.notCalled);
	});

});
