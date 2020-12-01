import { assert }  from '@open-wc/testing';
//import { SirenClasses } from '../../state/observable/SirenClasses.js';
import { SirenSubEntity } from '../../state/observable/SirenSubEntity.js';

describe('sirenSubEntity method tests', () => {
	it('subentity constructed from no object', () => {
		const sub = new SirenSubEntity();

		assert.isUndefined(sub.rel, 'subEntity rel field should be undefined when constructed from nothing');
		assert.isUndefined(sub._token, 'subEntity token field should be undefined when constructed from nothing');
		assert.instanceOf(sub._routes, Map, 'routes should be a Map');
		assert.equal(sub._routes.size, 0, 'subEntity routes should be empty when constructed');
	});

	it('subEntity constructed from empty object', () => {
		const sub = new SirenSubEntity({});

		assert.isUndefined(sub.rel, 'subEntity rel field should be undefined when constructed from empty object');
		assert.isUndefined(sub._token, 'subEntity token field should be undefined when constructed from empty object');
		assert.instanceOf(sub._routes, Map, 'routes should be a Map');
		assert.equal(sub._routes.size, 0, 'subEntity routes should be empty when constructed');
	});

	it('subEntity constructed from appropriate object', () => {
		const sub = new SirenSubEntity({ id: 'foo', token: 'bar' });

		assert.equal(sub.rel, 'foo', 'subEntity rel field initialized incorrectly');
		assert.equal(sub._token, 'bar', 'subEntity token field initialized incorrectly');
		assert.instanceOf(sub._routes, Map, 'routes should be a Map');
		assert.equal(sub._routes.size, 0, 'subEntity routes should be empty when constructed');
	});

	it('subEntity constructed from appropriate object and entityID set', () => {
		const sub = new SirenSubEntity({ id: 'foo', token: 'bar' });
		sub.entityID = 'baz';

		assert.equal(sub.rel, 'foo', 'subEntity rel field initialized incorrectly');
		assert.equal(sub._token, 'bar', 'subEntity token field initialized incorrectly');
		assert.equal(sub.entityID, 'baz', 'subEntity rel field set incorrectly');
		assert.instanceOf(sub._routes, Map, 'routes should be a Map');
		assert.equal(sub._routes.size, 0, 'subEntity routes should be empty when constructed');
	});
});

// describe('mergeing into subEntity', () => {
// 	let sub1, sub2, entity, method1, method2, obs1, obs2;

// 	beforeEach(() => {
// 		sub1 = new SirenSubEntity({ id: 'foo', token: 'bar' });
// 		sub2 = new SirenSubEntity({ id: 'abc', token: 'efg' });
// 		method1 = (val) => { `${val}1`; };
// 		method2 = (val) => { `${val}2`; };

// 		obs1 = {};
// 		obs2 = {};
// 	});

// 	it('entities are is not merged', () => {
// 		entity = new SirenClasses();
// 		entity.value = 'abc';

// 		sub1._merge(entity);

// 		// assert subEntity has not changed
// 		assert.isUndefined(sub1.rel, 'subEntity rel field should be undefined when constructed from empty object');
// 		assert.isUndefined(sub1._token, 'subEntity token field should be undefined when constructed from empty object');
// 		assert.instanceOf(sub1._routes, Map, 'routes should be a Map');
// 		assert.instanceOf(sub1._routes.size, 0, 'subEntity routes should be empty when constructed');

// 		// assert other entity has not changed
// 		assert.equal(entity.value, 'abc', 'SirenClasses value altered in merge');
// 		assert.equal(entity._observers.components.size, 0, 'SirenClass has observer added in merge');
// 	});

// 	it('subEntities are merged, both have methods', () => {
// 		sub1.addObserver(obs1, 'name', { method: method1 });
// 		sub2.addObserver(obs2, 'id', { method: method2 });

// 		sub1._merge(sub2);

// 		// checking that sub1 is updated correctly
// 		assert.equal(sub1._token, 'bar', 'sub1 token was not left unchanged after merge');
// 		assert.equal(sub1.rel, 'foo', 'sub1 rel was altered in merge');

// 		const map = sub1._observers.components;
// 		assert.equal(map.size, 2, 'sub map has incorrect size after another sub was merge into it');
// 		assert.equal(map.get(obs1), 'name', 'sub1 maps observer to incorrect value');
// 		assert.equal(map.get(obs2), 'id', 'sub1 maps observer to incorrect value');

// 		const methods = sub1._observers._methods;
// 		assert.isTrue(methods.has(obs1), 'method for observer is not stored');
// 		assert.equal(methods.get(obs1), method1, 'incorrect method stored for observer');
// 		assert.equal(obs1['name'], 'www.abc.com1', 'observer applies method incorrectly');

// 		assert.isTrue(methods.has(obs2), 'method for observer is not stored');
// 		assert.equal(methods.get(obs2), method2, 'incorrect method stored for observer');
// 		assert.equal(obs2['id'], 'www.xyz.com2', 'observer applies method incorrectly');

// 		// checking sub2 was not altered
// 		assert.equal(sub2._token, 'efg', 'sub2 token was not left unchanged after merge');
// 		assert.equal(sub2.rel, 'abc', 'sub2 rel was altered in merge');

// 		const map2 = sub2._observers.components;
// 		assert.equal(map2.size, 1, 'sub2 map has incorrect size after another sub was merge into it');
// 		assert.equal(map2.get(obs2), 'id', 'sub2 maps observer to incorrect value');

// 		const methods2 = sub1._observers._methods;
// 		assert.isTrue(methods2.has(obs2), 'method for observer is not stored');
// 		assert.equal(methods2.get(obs2), method2, 'incorrect method stored for observer');
// 		assert.equal(obs2['id'], 'id2', 'observer applies method incorrectly');
// 	});

// 	it('subEntities are merged, both have routes', () => {
// 		sub1.addObserver(obs1, 'name', { route: { name: 'abcde' } });
// 		sub2.addObserver(obs2, 'id', { route: { id: 'fghij' } });
// 		sub1._merge(sub2);

// 		// checking that sub1 is updated correctly
// 		assert.equal(sub1._token, 'bar', 'sub token was not left unchanged after merge');

// 		const map = sub1._observers.components;
// 		assert.equal(map.size, 0, 'SirenSub has incorrect number of observers');

// 		const routes = sub1._routes;
// 		assert.equal(routes.size, 2, 'incorrect number of routes stored in observer');
// 		assert.equal(routes.get(obs1).route, { name: 'abcde' }, 'route set incorrectly for observer');
// 		assert.equal(routes.get(obs2).route, { id: 'fghij' }, 'route set incorrectly for observer');

// 		// checking sub2 was not altered
// 		const map2 = sub2._observers.components;
// 		assert.equal(map2.size, 0, 'sub map has incorrect size after another sub was merge into it');
// 		const routes2 = sub1._routes;

// 		assert.equal(routes2.size, 1, 'incorrect number of routes stored in observer');
// 		assert.equal(routes2.get(obs2).route, { id: 'fghij' }, 'route set incorrectly for observer');
// 	});

// 	it('Two SirenSubs with unique components merged, method merged to route subEntity',  () => {
// 		sub1.addObserver(obs1, 'name', { route: { name: 'abcde' } });
// 		sub2.addObserver(obs2, 'id', { method: method1 });
// 		sub1._merge(sub2);

// 		// checking that sub1 is updated correctly
// 		const map = sub1._observers.components;
// 		assert.equal(map.size, 1, 'SirenSub has incorrect number of observers');
// 		assert.equal(map.get(obs2), 'id', 'observer maps to incorrect value');
// 		assert.isFalse(map.get(obs1), 'sub1 has observer with route');

// 		const methods = sub1._observers._methods;
// 		assert.isFalse(methods.has(obs1), 'method for observer is stored when no method present');

// 		assert.isTrue(methods.has(obs2), 'method for observer is not stored');
// 		assert.equal(methods.get(obs2), method1, 'incorrect method stored for observer');
// 		assert.equal(obs2['id'], 'www.abc.com1', 'observer applies method incorrectly');

// 		const routes = sub1._routes;
// 		assert.equal(routes.size, 1, 'incorrect number of routes stored in observer');
// 		assert.equal(routes.get(obs1).route, { name: 'abcde' }, 'route set incorrectly for observer');

// 		// checking sub2 was not altered
// 		const map2 = sub2._observers.components;
// 		assert.equal(map2.size, 1, 'sub map has incorrect size after another sub was merge into it');

// 		const methods2 = sub2._observers._methods;
// 		assert.isTrue(methods2.has(obs2), 'method for observer is not stored');
// 		assert.equal(methods2.get(obs2), method1, 'incorrect method stored for observer');
// 		assert.equal(obs2['id'], 'www.abc.com1', 'observer applies method incorrectly');

// 		const routes2 = sub1._routes;
// 		assert.equal(routes2.size, 0, 'incorrect number of routes stored in observer');
// 	});

// 	it('Two SirenSubs with unique components merged, route merged to method subEntity',  () => {
// 		sub1.addObserver(obs2, 'id', { method: method1 });
// 		sub2.addObserver(obs1, 'name', { route: { name: 'abcde' } });

// 		sub1._merge(sub2);

// 		// checking that sub1 is updated correctly
// 		const map = sub1._observers.components;
// 		assert.equal(map.size, 1, 'SirenSubEntity has incorrect number of observers');
// 		assert.equal(map.get(obs2), 'id', 'observer maps to incorrect value');
// 		assert.isFalse(map.get(obs1), 'sub1 has observer when should be routed');

// 		const methods = sub1._observers._methods;
// 		assert.isFalse(methods.has(obs1), 'method for observer is stored when no method present');

// 		assert.isTrue(methods.has(obs2), 'method for observer is not stored');
// 		assert.equal(methods.get(obs2), method1, 'incorrect method stored for observer');
// 		assert.equal(obs2['id'], 'www.abc.com1', 'observer applies method incorrectly');

// 		const routes = sub1._routes;
// 		assert.equal(routes.size, 1, 'incorrect number of routes stored in observer');
// 		assert.equal(routes.get(obs1).route, { name: 'abcde' }, 'route set incorrectly for observer');

// 		// checking sub2 was not altered
// 		const map2 = sub2._observers.components;
// 		assert.equal(map2.size, 0, 'sub map has incorrect size after another sub was merge into it');

// 		const methods2 = sub2._observers._methods;
// 		assert.isFalse(methods2.has(obs1), 'method for observer is not stored');
// 		assert.isFalse(methods2.has(obs2), 'method for observer is not stored');

// 		const routes2 = sub1._routes;
// 		assert.equal(routes2.size, 1, 'incorrect number of routes stored in observer');
// 		assert.equal(routes2.get(obs1).route, { id: 'abcde' }, 'route set incorrectly for observer');
// 	});
//});
