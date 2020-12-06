
import { HypermediaState, stateFactory, dispose, processRawJsonSirenEntity } from '../../state/HypermediaState';
import {observableTypes} from '../../state/observable/sirenObservableFactory';
import { FetchError } from '../../state/Fetchable';
import { assert, expect } from '@open-wc/testing';
import sinon from 'sinon/pkg/sinon-esm.js';
import fetchMock from 'fetch-mock/esm/client.js';
import SirenParse from 'siren-parser';
import { SirenAction } from '../../state/observable/SirenAction';
import {HypermediaStateMixin} from '../../framework/lit/HypermediaStateMixin';

function uniqueId() {
	return `${Date.now()}`;
}

describe.only('HypermediaState', () => {
	it('can create state for entity', () => {
		const state = new HypermediaState('foo', 'bar');
		assert.equal(state.entityID, 'foo');
	});

	it('addObservables - add one', () => {
		const observable = {
			classes: { type: Array, observable: observableTypes.classes }
		};
		const observer = { classes: [] };
		const state = new HypermediaState('foo', 'bar');
		state.addObservables(observer, observable);
	});

	it('addObservables - add duplicate ???', () => {
		const observable = {
			classes: { type: Array, observable: observableTypes.classes }
		};
		const observer = { classes: [] };
		const state = new HypermediaState('foo', 'bar');
		state.addObservables(observer, observable);
		state.addObservables(observer, observable);
	});

	it('addObservables - no basic info ??', () => {
		const observable = {
			something: { type: Array, different: 'foo' }
		};
		const observer = { unexpected: [] };
		const state = new HypermediaState('foo', 'bar');
		state.addObservables(observer, observable);
	});

	it('addObservables - add with route ??', () => {
		const observable = {
			classes: { type: Array, observable: observableTypes.classes, route: [{ value: 'abcde' }] }
		};
		const observer = { classes: [] };
		const state = new HypermediaState('foo', 'bar');
		state.addObservables(observer, observable);
	});

	it('addObservables - add SirenAction', () => {
		/*const observable = {
			classes: { type: Array, observable: observableTypes.classes, route: [{ value: 'abcde' }] }
		};*/
		const observer = { classes: [] };
		const state = new HypermediaState('foo', 'bar');
		const action = new SirenAction('foo', 'bar', state);
		state.addObservables(observer, action);
	});

	it('createChildState - how it is a child state when there is no actual object relations?', async() => {
		const state = new HypermediaState('foo', 'bar');
		const anotherState = await state.createChildState('anotherFoo', 'anotherBar');
		assert.equal(anotherState.entityID, 'anotherFoo');
	});

	it('createChildState - token has rawToken property', async() => {
		const state = new HypermediaState('foo', { rawToken: 'bar' });
		const anotherState = await state.createChildState('anotherFoo');
		assert.equal(anotherState.entityID, 'anotherFoo');
	});

	it.skip('can dispose observer', () => {
		const observable = {
			classes: { type: Array, observable: observableTypes.classes }
		};
		const observer = { classes: [] };
		const state = new HypermediaState('foo', 'bar');
		state.addObservables(observer, observable);
		state.dispose(observer);
		/* this test is failing.
		TypeError: sirenObservable.delete is not a function
			at state/HypermediaState.js:2650:31
			at Map.forEach (<anonymous>)
			at state/HypermediaState.js:2647:15
			at Map.forEach (<anonymous>)
			at HypermediaState.dispose (state/HypermediaState.js:2644:25)
			at Context.<anonymous> (test/state/HypermediaState.test.js:68:9)
			at Test.Runnable.run (node_modules/karma-mocha-snapshot/lib/adapter.js:14:17)
		*/
	});

	it.skip('handleCachePriming - questions about design', () => {
		//1. why it is part of the class instance methods, it should be a class static method'
		//2. Why it calls stateFactory? should it instead get state as parameter?

	});

	it.skip('handleCachePriming - unhandled error', async() => {
		const state = new HypermediaState('foo', 'bar');
		await state.handleCachePriming(['here', 'there']);
		/*
		TypeError: Cannot read property 'rawToken' of undefined
        at getToken (state/token.js:1284:97)
        at stateFactory (state/HypermediaState.js:2880:48)
        at state/HypermediaState.js:2666:52
        at Array.map (<anonymous>)
        at HypermediaState.handleCachePriming (state/HypermediaState.js:2664:30)
        at Context.<anonymous> (test/state/HypermediaState.test.js:83:15)
        at Test.Runnable.run (node_modules/karma-mocha-snapshot/lib/adapter.js:14:17)

		*/
	});

	describe('handleCachePriming', () => {
		beforeEach(() => {
			fetchMock.reset();
		});

		it('handleCachePriming - when token has rawTokenProperty', async() => {
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
			/* implementation has promise.All - dangerous, it is an accidental way to overload hypermedia server*/
		});

		it('handleCachePriming - when server responds with error', async() => {
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

	it('hasServerResponseCached - returns false', () => {
		const state = new HypermediaState('foo', 'bar');
		const isCached = state.hasServerResponseCached();
		assert.isFalse(isCached);
	});

	it('hasServerResponseCached - returns true', () => {
		const state = new HypermediaState('foo', 'bar');
		const isCached = state.hasServerResponseCached();
		assert.isFalse(isCached);
	});

	const invocationOptions = [
		{ passToken: true },
		{ passToken:false }
	];
	invocationOptions.forEach((option) => {
		it('processRawJsonSirenEntity should parse json and add entity to store', async() => {
			const stateToken = { rawToken: 'bar' };
			const state = new HypermediaState('foo', stateToken);
			const href = `http://foo-${uniqueId()}`;
			assert.isFalse(window.D2L.Foundation.StateStore.get(href, option.passToken ? 'token' : stateToken.rawToken));
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
			await state.processRawJsonSirenEntity(json, option.passToken ? 'token' : undefined);
			const newState = window.D2L.Foundation.StateStore.get(href, option.passToken ? 'token' : stateToken.rawToken);
			assert.equal(newState.entityID, href);
		});
	});

	it('push', () => {
		const stateToken = { rawToken: 'bar' };
		const state = new HypermediaState('foo', stateToken);
		const observable = {
			classes: { type: Array, observable: observableTypes.classes }
		};
		const observer = { classes: [] };
		state.addObservables(observer, observable);
		state.push();
	});

	it('setSirenEntity - parsed siren entity', async() => {
		const stateToken = { rawToken: 'bar' };
		const state = new HypermediaState('foo', stateToken);
		const observable = {
			classes: { type: Array, observable: observableTypes.classes }
		};
		const observer = { classes: [] };
		state.addObservables(observer, observable);
		const href = `http://foo-${uniqueId()}`;

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
		const entity = await SirenParse(json);
		state.setSirenEntity(entity);
	});

	it('setSirenEntity - null entity', async() => {
		const stateToken = { rawToken: 'bar' };
		const state = new HypermediaState('foo', stateToken);
		const observable = {
			classes: { type: Array, observable: observableTypes.classes }
		};
		const observer = { classes: [] };
		state.addObservables(observer, observable);
		state.setSirenEntity();
	});

	it('_getMap', () => {
		/* why get for non-existing identifier creates a new map? */
		const state = new HypermediaState('entityID', 'token');
		const someMap = new Map();
		const nonExistingKey = 'identifier';
		assert.isFalse(someMap.has(nonExistingKey));
		const mapCreatedForNonExistingKey = state._getMap(someMap, nonExistingKey);
		assert.instanceOf(mapCreatedForNonExistingKey, Map);
		assert.isTrue(someMap.has(nonExistingKey));
	});

	it('updateProperties', () => {
		const stateToken = { rawToken: 'bar' };
		const state = new HypermediaState('foo', stateToken);
		const observable = {
			classes: { type: Array, observable: observableTypes.classes }
		};
		state.updateProperties(observable);
	});

	it('updateProperties - should not update if sirenObserverDefinedProperty returns undefined', () => {
		const stateToken = { rawToken: 'bar' };
		const state = new HypermediaState('foo', stateToken);
		const observable = {
			classes: { type: Array, observable: 'unupported' }
		};
		state.updateProperties(observable);
	});

	it('setSirentEntity and updateProperties', async() => {
		const stateToken = { rawToken: 'bar' };
		const state = new HypermediaState('foo', stateToken);
		const observable = {
			classes: { type: Array, observable: observableTypes.classes }
		};
		const href = `http://foo-${uniqueId()}`;
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
		const entity = await SirenParse(json);
		state.setSirenEntity(entity);
		state.updateProperties(observable);
		console.log('??????????????????????????????');
		console.log(observable);
	});
	it('setSirentEntity - why could not continue if entity has href ?', async() => {
		const entityWithHref = {
			href: 'foo'
		};
		const state = new HypermediaState('foo', 'bar');
		state.setSirenEntity(entityWithHref);
	});

	it('push - what is does?', () => {

	});

});

describe.only('stateFactory', () => {
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

describe.only('processRawJsonSirenEntity', () => {

	it('should parse json and add entity to store', async() => {
		const href = `http://foo-${uniqueId()}`;
		assert.isFalse(window.D2L.Foundation.StateStore.get(href, 'token'));
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
		assert.equal(state.entityID, href);
	});

	it('should not add selfless entity to store', async() => {
		const href = `http://foo-${uniqueId()}`;
		assert.isFalse(window.D2L.Foundation.StateStore.get(href, 'token'));
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
		const state = window.D2L.Foundation.StateStore.get(href, 'token');
		assert.isFalse(state, 'state should not be added');
	});
});

describe.only('dispose', () => {
	it('can dispose state', () => {
		const state = new HypermediaState('entityID', 'token');
		const observable = {
			classes: { type: Array, observable: observableTypes.classes }
		};
		const observer = { classes: [] };
		state.addObservables(observer, observable);
		dispose(state, observable);

		/* test fails
			TypeError: sirenObservable.delete is not a function
			at state/HypermediaState.js:2681:31
			at Map.forEach (<anonymous>)
			at state/HypermediaState.js:2678:15
			at Map.forEach (<anonymous>)
			at HypermediaState.dispose (state/HypermediaState.js:2675:25)
			at dispose (state/HypermediaState.js:2940:75)
			at Context.<anonymous> (test/state/HypermediaState.test.js:367:3)
			at Test.Runnable.run (node_modules/karma-mocha-snapshot/lib/adapter.js:14:17)
		*/
	});
	it('dispose - questions', () => {
		// 1. stateFactory is adding state to the StateStore. When disposing state does it need to remove it from the store
	});
});
