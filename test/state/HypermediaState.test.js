
import { dispose, processRawJsonSirenEntity, stateFactory } from '../../state/HypermediaState';
import { assert } from '@open-wc/testing';
import { fetch } from '../../state/fetch';
import { FetchError } from '../../state/Fetchable';
import fetchMock from 'fetch-mock/esm/client.js';
import { observableTypes } from '../../state/observable/sirenObservableFactory';
import sinon from 'sinon/pkg/sinon-esm.js';
import SirenParse from 'siren-parser';

function uniqueId() {
	return `${Date.now()}`;
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

		it('observable with route', async() => {
			const observable = {
				mainEntityClass: { observable: observableTypes.classes },
				linkedEntityProperty: {
					observable: observableTypes.property,
					route: [
						{ observable: observableTypes.link, rel: 'linked'  }
					]
				}
			};

			const entityHref = `http://entity-${uniqueId()}`;
			const linkedHref = `${entityHref}/linked`;
			const observer = {};

			const entity = {
				class: ['main-entity-class'],
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

			await fetch(state);
			// need a delay for onServerResponse callback to fetch&process main entity  then fetch&process liked entity
			await (new Promise(resolve => setTimeout(() => resolve(), 20)));

			assert.isTrue(mock.called(entityHref), `should fetch ${entityHref}`);
			assert.isTrue(mock.called(linkedHref), `should fetch ${linkedHref}`);
			assert.deepEqual(observer, {
				mainEntityClass: ['main-entity-class'],
				linkedEntityProperty: 'linked-entity-name'
			}, 'class should be observed from main entity and property should be fetched from linked entity');
		});

		it('observable with method', async() => {
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

	describe('createChildState method', () => {
		it('can create new state by calling state.createChildState ', async() => {
			const state = await stateFactory(uniqueId(), 'bar');
			const anotherState = await state.createChildState('anotherFoo', 'anotherBar');
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
		const methods = ['push', 'reset'];
		let state, putActionSpy, getActionSpy, subEntityChilStateSpy, linkPrimeChildStateSpy;
		before(async() => {
			const entityHref = `http://entity-${uniqueId()}`;
			const observable = {
				actionPut: { observable: observableTypes.action, name: 'do-put' },
				// need route or prime to pass token to observable so SirenLink observable will fetch the link and will create child state
				linkPrime: { observable: observableTypes.link, rel: 'prime', prime: true },
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
				links: [{ rel: [ 'self' ], href: entityHref }, { rel: [ 'prime' ], href: `${entityHref}/prime` }]
			};

			state = await stateFactory(entityHref, 'token');
			const observer = {};

			state.addObservables(observer, observable);
			state.setSirenEntity(SirenParse(JSON.stringify(entity)));

			//need to await until asyncroneous callbacks are resolved, before proceeding
			await (new Promise(resolve => setTimeout(() => resolve(), 20)));

			// create spies for observables
			const putActionObservable = state._getSirenObservable({ type: observableTypes.action, id: 'do-put' });
			const getActionObservable = state._getSirenObservable({ type: observableTypes.action, id: 'do-get' });
			const linkPrimeObservable = state._getSirenObservable({ type: observableTypes.link, id: 'prime' });
			const subEntityObservable = state._getSirenObservable({ type: observableTypes.subEntity, id: 'item' });
			putActionSpy = sinon.spy(putActionObservable);
			getActionSpy = sinon.spy(getActionObservable);
			subEntityChilStateSpy = sinon.spy(subEntityObservable.childState);
			linkPrimeChildStateSpy = sinon.spy(linkPrimeObservable.childState);
		});

		methods.forEach((method) => {
			it(`should call ${method} method for childStates and for action observables`, async() => {
				// push or reset state
				await state[method]();

				//verify shild states where pushed or reset
				assert.isTrue(subEntityChilStateSpy[method].calledOnce);
				assert.isTrue(linkPrimeChildStateSpy[method].calledOnce);

				// verify entity actions where pushed or reset
				assert.isTrue(putActionSpy[method].calledOnce);
				assert.isTrue(getActionSpy[method].calledOnce);
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
		await (new Promise(resolve => setTimeout(() => resolve(), 20)));
		assert.isTrue(spy.onServerResponse.called);
		assert.isTrue(spy.setSirenEntity.called);
		assert.isTrue(mock.called(selfHref));
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
			await (new Promise(resolve => setTimeout(() => resolve(), 200)));
		} catch (e) {
			processingError = e;
		}

		assert.isTrue(mock.called(selfHref));
		assert.instanceOf(processingError, FetchError, 'should thow FetchError object');
		assert.isTrue(spy.setSirenEntity.notCalled);
		assert.isTrue(spy.onServerResponse.called);
	});

});

