
import { dispose, HypermediaState, processRawJsonSirenEntity, stateFactory } from '../../state/HypermediaState';
import { assert } from '@open-wc/testing';
import { fetch } from '../../state/fetch';
import { FetchError } from '../../state/Fetchable';
import { fetchMock } from 'fetch-mock/esm/client.js';
import { observableTypes } from '../../state/observable/sirenObservableFactory';
import { sinon } from 'sinon/pkg/sinon-esm.js';
import { SirenParse } from 'siren-parser';

function uniqueId() {
	return `${Date.now()}`;
}

function assertAreSimilar(actual, expected) {
	// converting object to json and then parsing in again leave only comparable properties.
	assert.deepEqual(JSON.parse(JSON.stringify(actual)), JSON.parse(JSON.stringify(expected)));
}

describe('HypermediaState class', () => {
	describe('constructor', () => {
		it('can create HypermediaState object', () => {
			const id = 'id';
			const token = 'token';
			const state = new HypermediaState(id, token);
			assert.equal(state.entityID, id);
			assert.equal(state.href, id);
			assert.equal(state.token, token);
		});

		it('why it is allowed to create invalid HypermediaState object ?', () => {
			const state = new HypermediaState();
			assert.equal(state.entityID, undefined);
			assert.equal(state.href, undefined);
			assert.equal(state.token, undefined);
		});
	});

	describe('addObservables and setSirenEntity methods', () => {

		it('should create correct observable type and assign values to observer', async() => {

			const observer = {};
			const entityHref = `http://entity-${uniqueId()}`;
			const state = new HypermediaState(entityHref, 'token');
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
						rel: [ 'sub1', 'item' ],
						href: 'http://foo/sub1'
					},
					{
						class: [ 'foo-sub-entity-2' ],
						rel: [ 'sub2', 'item' ],
						href: 'http://foo/sub2'
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
			state.setSirenEntity(SirenParse(JSON.stringify(entity)));

			assert.deepEqual(observer.class, entity.class);
			assert.deepEqual(observer.name, entity.properties.name);
			assert.deepEqual(observer.description, entity.properties.description);
			assertAreSimilar(observer.subEntity1, entity.entities[0]);
			assertAreSimilar(observer.subEntity2, entity.entities[1]);
			assertAreSimilar(observer.actionGet, { has: true });
			assertAreSimilar(observer.actionPut, { has: true });
			assert.equal(observer.linkNext, entity.links[0].href);
			assert.equal(observer.linkSelf, entity.links[1].href);
			assertAreSimilar(observer.subEntities, entity.entities);
			assertAreSimilar(observer.entity, entity);
		});

		it.skip('#addObservables - add with route - does not work as expected.', async() => {
			const observable = {
				class: { observable: observableTypes.classes },
				name: {
					observable: observableTypes.property,
					route: [
						{ observable: observableTypes.link, rel: 'sub'  }
					]
				}
			};

			const entityHref = `http://entity-${uniqueId()}`;
			const linkedHref = `${entityHref}/linked`;
			const observer = {};
			const state = new HypermediaState(entityHref, { rawToken:'token' });
			const entity = {
				class: ['foo'],
				links: [{ rel: [ 'linked' ], href: linkedHref }]
			};
			const linkedEntity = {
				class: ['linked'],
				properties: { name: 'linked-name' },
				links: [{ rel:['self'], href: linkedHref }]
			};

			const mock = fetchMock
				.mock(entityHref, JSON.stringify(entity))
				.mock(linkedHref, JSON.stringify(linkedEntity));

			state.addObservables(observer, observable);
			state.setSirenEntity(SirenParse(JSON.stringify(entity)));
			await fetch(state);

			assert.isTrue(mock.called(entityHref));
			assert.isTrue(mock.called(linkedHref));
			assert.deepEqual(observer, { class: ['foo'], name: 'property of subentity' });
		});

		it('addObservables after setSirenEntity', () => {
			const observable = {
				classes: { observable: observableTypes.classes }
			};
			const entity = {
				class: ['class1']
			};
			const observer = {};
			const state = new HypermediaState('foo', 'bar');
			state.setSirenEntity(SirenParse(JSON.stringify(entity)));
			state.addObservables(observer, observable);
			assert.deepEqual(observer, { classes: entity.class });
		});

		it('what is intent for calling setSirenEntity without parameter', async() => {
			const stateToken = { rawToken: 'bar' };
			const state = new HypermediaState('foo', stateToken);
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

			// whhen calling setSirenEntity without param it just reaplies stored entity to observervable.
			// Each observable will behave differently.
			// For example ClassessObservable will not reaaply same value to observer if entity is not changed.
			// What it the intent?
			observer.classes.shift();
			assert.deepEqual(observer, { classes: [] });
			const stateEntityBefore = state._entity;
			state.setSirenEntity();
			const stateEntityAfter = state._entity;
			assert.equal(stateEntityBefore, stateEntityAfter);
		});

		it('observer should recieve updates when siren entity is updated', () => {
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
			const state = new HypermediaState('foo', 'bar');
			state.addObservables(observer, observable);
			state.setSirenEntity(SirenParse(JSON.stringify(entity)));
			assert.deepEqual(observer, { classes: entity.class });
			state.setSirenEntity(SirenParse(JSON.stringify(updatedEntity)));
			assert.deepEqual(observer, { classes: updatedEntity.class });
		});

		it('setSirentEntity - why could not continue if entity has href ?', async() => {
			// setSirentEntity partial code snippet:
			// if (entity && entity.href) {
			//	return;
			//}

			const entityWithHref = {
				href: 'foo'
			};
			const state = new HypermediaState('foo', 'bar');
			state.setSirenEntity(entityWithHref);
			const spy = sinon.spy(state._decodedEntity);
			assert.isTrue(spy.forEach.notCalled);
		});
	});

	describe('createChildState method', () => {
		it('Why it is named createChildState when there is no actual object relations?', async() => {
			const state = new HypermediaState('foo', 'bar');
			const anotherState = await state.createChildState('anotherFoo', 'anotherBar');
			assert.equal(anotherState.entityID, 'anotherFoo');
			assert.equal(anotherState.token, 'anotherBar');
		});
	});

	describe('dispose method', () => {
		it('disposed observer does not recieve updates', () => {
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
			const state = new HypermediaState('foo', 'bar');
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

		it('Should crete state per link and fetch data', async() => {
			const link1 = `http://link1-${uniqueId()}`;
			const link2 = `http://link2-${uniqueId()}`;
			const mockLink = fetchMock
				.mock(link1, {})
				.mock(link2, {});
			const state = new HypermediaState('foo', { rawToken: 'bar' });
			assert.isFalse(window.D2L.Foundation.StateStore.get(link1, 'bar'));
			assert.isFalse(window.D2L.Foundation.StateStore.get(link2, 'bar'));
			await state.handleCachePriming([link1, link2]);
			assert.isTrue(mockLink.called(link1));
			assert.isTrue(mockLink.called(link2));
			assert.equal(window.D2L.Foundation.StateStore.get(link1, 'bar').entityID, link1);
			assert.equal(window.D2L.Foundation.StateStore.get(link2, 'bar').entityID, link2);
			/* 	Implementation of handleCachePriming uses promise.All to fetch all links.
				it is an accidental way to overload backend server
			*/
		});

		it('should create state per link and throw FetchError on error', async() => {
			const link1 = `http://link1-${uniqueId()}`;
			const link2 = `http://link2-${uniqueId()}`;
			const mockLink = fetchMock
				.mock(link1, 500)
				.mock(link2, {});
			const state = new HypermediaState('foo', { rawToken: 'bar' });
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
		it('returns false when entity is not set', () => {
			const state = new HypermediaState('foo', 'bar');
			const isCached = state.hasServerResponseCached();
			assert.isFalse(isCached);
		});

		it('returns true when entity is set', () => {
			const state = new HypermediaState('foo', 'bar');
			state.setSirenEntity(SirenParse(JSON.stringify({ class: ['foo'] })));
			const isCached = state.hasServerResponseCached();
			assert.isTrue(isCached);
		});

		it('returns true after entity is reset', () => {
			const state = new HypermediaState('foo', 'bar');
			state.setSirenEntity(SirenParse(JSON.stringify({ class: ['foo'] })));
			assert.isTrue(state.hasServerResponseCached());
			state.reset();
			assert.isTrue(state.hasServerResponseCached());
		});
	});

	describe('push and reset methods', () => {
		const methods = ['push', 'reset'];
		let state, putActionSpy, getActionSpy, linkChildStateSpy, subEntityChilStateSpy;
		before(async() => {
			const entityHref = `http://entity-${uniqueId()}`;
			const observable = {
				actionPut: { observable: observableTypes.action, name: 'do-put' },
				// why need route to pass token to observable ?. Without token link does not create a child state
				linkSelf: { observable: observableTypes.link, rel: 'self', route: [{ abc: 'need route to pass token to ' }] },
				subEntity: { observable: observableTypes.subEntity, rel: 'item', route: [{ abc: 'need route to pass token to ' }] }
			};
			const entity = {
				class:['foo'],
				entities: [{
					class: [ 'foo-sub-class' ],
					rel: [ 'item' ],
					href: 'http://foo/sub1'
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
				links: [{ rel: [ 'self' ], href: entityHref }]
			};
			state = new HypermediaState(entityHref, { rawToken: 'token' });
			const observer = {};

			state.addObservables(observer, observable);
			state.setSirenEntity(SirenParse(JSON.stringify(entity)));
			/*
				state.setSirenEntity does not await for observables.setSirenEntity
				and the SirenLink.childState is not created yet because it is calling async method createChildState
				Solution that I don't like: put delay before continuing.
				Solution that someone may not like: await for observables to finish with setSirenEntity.
			*/
			await (new Promise(resolve => setTimeout(() => resolve(), 100)));

			// create spies for observables
			const putActionObservable = state._getSirenObservable({ type: observableTypes.action, id: 'do-put' });
			const getActionObservable = state._getSirenObservable({ type: observableTypes.action, id: 'do-get' });
			const linkObservable = state._getSirenObservable({ type: observableTypes.link, id: 'self' });
			const subEntityObservable = state._getSirenObservable({ type: observableTypes.subEntity, id: 'item' });
			putActionSpy = sinon.spy(putActionObservable);
			getActionSpy = sinon.spy(getActionObservable);
			linkChildStateSpy = sinon.spy(linkObservable.childState);
			subEntityChilStateSpy = sinon.spy(subEntityObservable.childState);
		});
		methods.forEach((method) => {
			it(`should call ${method} method for childStates and for action observables`, async() => {
				// push or reset state
				state[method]();

				//verify shild states where pushed or reset
				assert.isTrue(linkChildStateSpy[method].calledOnce);
				assert.isTrue(subEntityChilStateSpy[method].calledOnce);

				// verify entity actions where pushed or reset
				assert.isTrue(putActionSpy[method].calledOnce);
				assert.isTrue(getActionSpy[method].calledOnce);
			});

		});
	});

	describe('supdateProperties method', () => {

		it('should update observable value property', () => {
			const stateToken = { rawToken: 'bar' };
			const state = new HypermediaState('foo', stateToken);
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

			// this method needs comment in the code about how it is intended to be used.
			// My observation:
			// component calls commit method on an action and passess some observable of property type as parameter and value to be set.
			// this observable is got updated without actually pushing update to server.
			// https://github.com/BrightspaceHypermediaComponents/foundation-components/blob/85b5410e28eb0eec93b1ba00baecf482999e621c/components/activity/name/custom/d2l-activity-name-learning-path.js#L34
			// https://github.com/BrightspaceHypermediaComponents/foundation-engine/blob/06c8381f7656ad07a5bb0fb8dcb39202f1287074/state/observable/SirenAction.js#L104
			//
		});

		it('should not update observable type is not supported', () => {
			const stateToken = { rawToken: 'bar' };
			const state = new HypermediaState('foo', stateToken);
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
			const stateToken = { rawToken: 'bar' };
			const tokenForNewState = 'token';
			const state = new HypermediaState('foo', stateToken);
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
			const stateToken = { rawToken: 'bar' };
			const state = new HypermediaState('foo', stateToken);
			const href = `http://foo-${uniqueId()}`;
			assert.isFalse(window.D2L.Foundation.StateStore.get(href, stateToken.rawToken), 'state should not exist yet');
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
			const newState = window.D2L.Foundation.StateStore.get(href, stateToken.rawToken);
			assert.equal(newState.entityID, href);
			assert.equal(newState.token.rawToken, stateToken.rawToken);
		});
	});
});

describe('stateFactory function', () => {
	it('can create state and add it to the window.D2L.Foundation.StateStore', async() => {
		const id = uniqueId();
		const state = await stateFactory(id, 'bar');
		assert.isTrue(state instanceof HypermediaState);
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
			  { "rel": [ "not-my-self-today" ], "href": "${href}" }
			]
		  }`;
		await processRawJsonSirenEntity(json, 'token');
		assert.isFalse(window.D2L.Foundation.StateStore.get(href, 'token'), 'state should not be created');
	});
});

describe('dispose function', () => {
	it('can dispose state', () => {
		const state = new HypermediaState('entityID', 'token');
		const observable = {
			classes: { type: Array, observable: observableTypes.classes }
		};
		const observer = { classes: [] };
		state.addObservables(observer, observable);
		const spy = sinon.spy(state);
		dispose(state, observer);
		assert.isTrue(spy.dispose.called);
	});
	it('dispose - question about dispose purpose', () => {
		// 1. stateFactory is adding state to the StateStore.
		// When disposing state does it need to remove it from the store ?
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
					// is it a bug that observer only gets href, and no class ?
					class: [ 'foo-sub-entity-1' ],
					rel: [ 'sub1' ],
					href: 'http://foo/sub1'
				},
				{ // Is it a bug that this is entity is not assigned to observer
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
		assert.isTrue(spy.onServerResponse.called);
		assert.isTrue(spy.setSirenEntity.called);
		assert.isTrue(mock.called(selfHref));
		assert.deepEqual(observer.class, entity.class);
		assert.deepEqual(observer.name, entity.properties.name);
	});

	it('FetchErro should be thown and setSirenEntity should not be called', async() => {
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

		assert.isTrue(mock.called(selfHref));
		assert.instanceOf(processingError, FetchError, 'should thow FetchError object');
		assert.isTrue(spy.onServerResponse.called);
		assert.isTrue(spy.setSirenEntity.notCalled);
	});

});

