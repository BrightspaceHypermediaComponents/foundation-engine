import { assert }  from '@open-wc/testing';
import { SirenLink } from '../../state/observable/SirenLink.js';

describe('call sirenLink methods', () => {
	it('sirenLink constructed from no object', () => {
		const link = new SirenLink();
		assert.isUndefined(link.rel, 'SirenLink rel set when no id present');
		assert.instanceOf(link._routes, Map, 'SirenLink route is not a Map');
		assert.isUndefined(link._token, 'SirenLink token set when no token present');
	});

	it('sirenLink constructed from empty object', () => {
		const link = new SirenLink({});
		assert.isUndefined(link.rel, 'SirenLink rel set when no id present');
		assert.instanceOf(link._routes, Map, 'SirenLink route is not a Map');
		assert.isUndefined(link._token, 'SirenLink token set when no token present');
	});

	it('sirenLink constructed from object with id', () => {
		const link = new SirenLink({ id: 'hello' });
		assert.equal(link.rel, 'hello', 'SirenLink rel set incorrectly from constructor');
		assert.instanceOf(link._routes, Map, 'SirenLink route is not a Map');
		assert.isUndefined(link._token, 'SirenLink token set when no token present');
	});

	it('sirenLink constructed from object with token', () => {
		const link = new SirenLink({ token: 'goodbye' });
		assert.isUndefined(link.rel, 'SirenLink rel set when no id present');
		assert.instanceOf(link._routes, Map, 'SirenLink route is not a Map');
		assert.equal(link._token, 'goodbye', 'SirenLink token set incorrectly from constructor');
	});

	it('SirenLink has link set', () => {
		const link = new SirenLink();
		link.href = 'abc';
		assert.equal(link.href, 'abc', 'SirenLink link set incorrectly');
		assert.equal(link._observers._observers.size, 0, 'SirenClass has observer when it should not');
	});
});

describe('sirenLink with observers', () => {
	let link, obs, method;

	beforeEach(() => {
		link = new SirenLink({ id: 'foo', token: 'bar' });
		link.href = 'baz';
		obs = { foo: undefined };
		method = (val) => val;
	});

	it('SirenLink has an observer attached', () => {
		const link = new SirenLink();

		link.addObserver(obs, 'foo', { method });

		const map = link._observers._observers;
		assert.equal(map.size, 1, 'SirenLink has incorrect number of observers');
		assert.equal(map.get(obs), 'foo', 'object maps to incorrect value');

		const methods = link._observers._methods;
		assert.equal(link._routes.size, 0);
		assert.isTrue(methods.has(obs), 'method for observer should be stored');
		assert.equal(methods.get(obs), method, 'incorrect method stored for observer');
		assert.isUndefined(obs['foo'], 'observer applies method incorrectly');
	});

	it('object is added with property it does not have as an observer', () => {
		link.addObserver(obs, 'hello', { method });

		const map = link._observers._observers;
		assert.equal(map.size, 1, 'SirenLink has incorrect number of observers');
		assert.equal(map.get(obs), 'hello', 'observer maps to incorrect value');

		const methods = link._observers._methods;
		assert.isTrue(methods.has(obs), 'method for observer is not stored');
		assert.equal(methods.get(obs), method, 'incorrect method stored for observer');
		assert.equal(obs['hello'], 'baz', 'observer applies method incorrectly');
	});

	it('SirenLink with link has an object with route attached', () => {
		link.addObserver(obs, 'hello', { route: { value: 'abcde' }, method });

		const map = link._observers._observers;
		assert.equal(map.size, 0, 'SirenLink has incorrect number of observers');

		const routes = link._routes;
		assert.equal(routes.size, 1, 'incorrect number of routes stored in observer');
		assert.equal(routes.get(obs).value, 'abcde', 'route set incorrectly for observer');

		const methods = link._observers._methods;
		assert.isFalse(methods.has(obs), 'method for observer is not stored');
	});

	it('SirenLink with link has an object with route removed', () => {
		link.addObserver(obs, 'hello', { route: 'abcde' });
		link.deleteObserver(obs);

		const map = link._observers._observers;
		assert.equal(map.size, 0, 'SirenLink has incorrect number of observers');

		const routes = link._routes;
		assert.equal(routes.size, 0, 'incorrect number of routes stored in observer');
	});

	it('SirenLink update route with same fields', () => {
		link.addObserver(obs, 'hello', { route: { value: 'abcde' } });
		link.addObserver(obs, 'hello', { route: { value: 'fghij' } });

		const map = link._observers._observers;
		assert.equal(map.size, 0, 'SirenLink has incorrect number of observers');

		const routes = link._routes;
		assert.equal(routes.size, 1, 'incorrect number of routes stored in observer');
		assert.equal(routes.get(obs).value, 'fghij', 'route set incorrectly for observer');
	});

	it('SirenLink update route with unique fields', () => {
		link.addObserver(obs, 'hello', { route: { name: 'abcde' } });
		link.addObserver(obs, 'hello', { route: { id: 'fghij' } });

		const map = link._observers._observers;
		assert.equal(map.size, 0, 'SirenLink has incorrect number of observers');

		const routes = link._routes;
		assert.equal(routes.size, 1, 'incorrect number of routes stored in observer');
		assert.equal(routes.get(obs).id, 'fghij', 'route set incorrectly for observer');
	});
});

// describe.only('merging sirenLinks', () => {
// 	let link1, link2, method1, method2, obs1, obs2;

// 	beforeEach(() => {
// 		link1 = new SirenLink({ id: 'foo', token: 'bar' });
// 		link2 = new SirenLink({ id: 'abc', token: 'def' });
// 		link1.link = { href: 'www.abc.com' };
// 		link2.link = { href: 'www.xyz.com' };
// 		method1 = (val) => { `${val}1`; };
// 		method2 = (val) => { `${val}2`; };

// 		obs1 = { name: '1234' };
// 		obs2 = { id: '5678' };
// 	});

// 	it('Two SirenLinks with unique components without routes are merged',  () => {
// 		link1.addObserver(obs1, 'name', { method: method1 });
// 		link2.addObserver(obs2, 'id', { method: method2 });
// 		link1._merge(link2);

// 		// checking that link1 is updated correctly
// 		assert.equal(link1._token, 'bar', 'link token was not left unchanged after merge');
// 		assert.equal(link1.rel, 'foo', 'link rel was altered in merge');

// 		const map = link1._observers._observers;
// 		assert.equal(map.size, 2, 'link map has incorrect size after another link was merged into it');
// 		assert.equal(map.get(obs1), 'name', 'observer maps to incorrect value');
// 		assert.equal(map.get(obs2), 'id', 'observer maps to incorrect value');

// 		const methods = link1._observers._methods;
// 		assert.isTrue(methods.has(obs1), 'method for observer is not stored');
// 		assert.equal(methods.get(obs1), method1, 'incorrect method stored for observer');
// 		assert.equal(obs1['name'], 'www.abc.com1', 'observer applies method incorrectly');

// 		assert.isTrue(methods.has(obs2), 'method for observer is not stored');
// 		assert.equal(methods.get(obs2), method2, 'incorrect method stored for observer');
// 		assert.equal(obs2['id'], 'www.xyz.com2', 'observer applies method incorrectly');

// 		// checking link2 was not altered
// 		const map2 = link2._observers._observers;
// 		assert.equal(map2.size, 1, 'link map has incorrect size after another link was merge into it');
// 		assert.equal(map2.get(obs2), 'id', 'observer maps to incorrect value');

// 		const methods2 = link1._observers._methods;
// 		assert.isTrue(methods2.has(obs2), 'method for observer is not stored');
// 		assert.equal(methods2.get(obs2), method2, 'incorrect method stored for observer');
// 		assert.equal(obs2['id'], 'id2', 'observer applies method incorrectly');
// 	});

// 	it('Two SirenLinks with unique components with routes are merged',  () => {
// 		link1.addObserver(obs1, 'name', { route: { name: 'abcde' } });
// 		link2.addObserver(obs2, 'id', { route: { id: 'fghij' } });
// 		link1._merge(link2);

// 		// checking that link1 is updated correctly
// 		assert.equal(link1._token, 'bar', 'link token was not left unchanged after merge');

// 		const map = link1._observers._observers;
// 		assert.equal(map.size, 0, 'SirenLink has incorrect number of observers');

// 		const routes = link1._routes;
// 		assert.equal(routes.size, 2, 'incorrect number of routes stored in observer');
// 		assert.equal(routes.get(obs1).route, { name: 'abcde' }, 'route set incorrectly for observer');
// 		assert.equal(routes.get(obs2).route, { id: 'fghij' }, 'route set incorrectly for observer');

// 		// checking link2 was not altered
// 		const map2 = link2._observers._observers;
// 		assert.equal(map2.size, 0, 'link map has incorrect size after another link was merge into it');
// 		const routes2 = link1._routes;

// 		assert.equal(routes2.size, 1, 'incorrect number of routes stored in observer');
// 		assert.equal(routes2.get(obs2).route, { id: 'fghij' }, 'route set incorrectly for observer');
// 	});

// 	it('Two SirenLinks with unique components merged, one method, one route',  () => {
// 		link1.addObserver(obs1, 'name', { route: { name: 'abcde' } });
// 		link2.addObserver(obs2, 'id', { method: method1 });
// 		link1._merge(link2);

// 		// checking that link1 is updated correctly
// 		assert.equal(link1._token, 'bar', 'link token was not left unchanged after merge');

// 		const map = link1._observers._observers;
// 		assert.equal(map.size, 1, 'SirenLink has incorrect number of observers');
// 		assert.equal(map.get(obs2), 'id', 'observer maps to incorrect value');
// 		assert.isFalse(map.get(obs1), 'observer maps to incorrect value when routed');

// 		const methods = link1._observers._methods;
// 		assert.isFalse(methods.has(obs1), 'method for observer is stored when no method present');

// 		assert.isTrue(methods.has(obs2), 'method for observer is not stored');
// 		assert.equal(methods.get(obs2), method1, 'incorrect method stored for observer');
// 		assert.equal(obs2['id'], 'www.abc.com1', 'observer applies method incorrectly');

// 		const routes = link1._routes;
// 		assert.equal(routes.size, 2, 'incorrect number of routes stored in observer');
// 		assert.equal(routes.get(obs1).route, { name: 'abcde' }, 'route set incorrectly for observer');
// 		assert.equal(routes.get(obs2).route, { id: 'fghij' }, 'route set incorrectly for observer');

// 		// checking link2 was not altered
// 		const map2 = link2._observers._observers;
// 		assert.equal(map2.size, 0, 'link map has incorrect size after another link was merge into it');

// 		const methods2 = link2._observers._methods;
// 		assert.isTrue(methods2.has(obs2), 'method for observer is not stored');
// 		assert.equal(methods2.get(obs2), method1, 'incorrect method stored for observer');
// 		assert.equal(obs2['id'], 'www.abc.com1', 'observer applies method incorrectly');

// 		const routes2 = link1._routes;
// 		assert.equal(routes2.size, 0, 'incorrect number of routes stored in observer');
// 	});
// });

// describe('sirenLink set siren entity', () => {
// 	let link1, link2, entity; // method1, method2, obs1, obs2,

// 	beforeEach(() => {
// 		link1 = new SirenLink({ id: 'foo', token: 'bar' });
// 		link2 = new SirenLink({ id: 'abc', token: 'def' });
// 		link1.link = { href: 'www.abc.com', rel: ['12345'] };
// 		link2.link = { href: 'www.xyz.com', rel: ['67890'] };

// 		// method1 = (val) => { `${val}1`; };
// 		// method2 = (val) => { `${val}2`; };

// 		// obs1 = new Component();
// 		// obs2 = new Component();

// 		const stub1 = sinon.stub(entity, 'hasLinkByRel');
// 		stub1.callsFake(() => true);
// 		const stub2 = sinon.stub(entity, 'getLinkByRel');
// 		stub2.callsFake(() => 'foo');
// 	});

// 	it('sirenEntity without link set attempted and failed', () => {
// 		const stub1 = sinon.stub(entity, 'hasLinkByRel');
// 		stub1.callsFake(() => false);
// 		entity = new SirenEntity();

// 		link1.setSirenEntity(entity);

// 		assert.equal(link1.rel, 'foo', 'SirenLink rel altered when linkless entity set');
// 		assert.instanceOf(link1._routes, Map, 'SirenLink route is not a Map');
// 		assert.equal(link1.routes.size, 0, 'SirenLink number of routes increased when linkless entity set');
// 		assert.equal(link1._token, 'bar', 'SirenLink token altered when linkless entity set');
// 		assert.isUndefined(link1.childState, 'SirenLink child state set with linkless entity');
// 	});

// 	it('sirenEntity without link set attempted and failed', () => {
// 		const entityToSet = new SirenLink({ id: 'cat', token: 'meow' });
// 		entityToSet.link = { href: 'testing', rel: ['12345'] };

// 		const linkCollection = new Map();
// 		linkCollection['12345'] = link2;

// 		link1.addObserver(obs1, 'foo', { method: method1 });
// 		link2.addObserver(obs2, 'bar', { method: method2 });
// 		link1.setSirenEntity(entityToSet);

// 		const observers = link1._observers._observers;
// 		assert.equal(observers.size, 1, 'link has incorrect observers after set entity should add one');
// 		assert.equal(observers.get());
// 	});
// });
