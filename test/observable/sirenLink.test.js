import { assert }  from '@open-wc/testing';
import { SirenLink } from '../../state/observable/SirenLink.js';
import SirenParse from 'siren-parser';
import { SirenSubEntity } from '../../state/observable/SirenSubEntity.js';
import { testLinks } from '../data/observable/entities.js';

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

	describe('should call setSirenEntity', () => {
		// testLinks are imported from ../data/observable/entities.js for testing
		let link1, collection;
		beforeEach(() => {
			collection = new Map();
			link1 = new SirenLink({ id: 'foo', token: 'bar' });

		});

		it('should update SirenLinks href to be the href from test data', () => {
			const entity = SirenParse(testLinks[0]);

			link1.setSirenEntity(entity);
			assert.equal(link1.href, 'http://example.com', 'should be href from testLinks[0]');
		});

		it('should not update SirenLinky', () => {
			const entity = SirenParse(testLinks[1]);

			link1.setSirenEntity(entity);

			assert.isUndefined(link1.href, 'should be unset by entity not matching property');
		});

		it('should merge observer from collection link into link1', () => {
			const entity = SirenParse(testLinks[0]);
			const link2 = new SirenLink({ id: 'foo', token: '123' });
			const observer = { foo: 'wow' };
			link2.addObserver(observer, 'foo');
			collection.set('foo', link2);

			assert.equal(observer['foo'], 'wow', 'observer should have property set to initial value');

			link1.setSirenEntity(entity, collection);

			assert.equal(link1.href, 'http://example.com', 'should be href from testLinks[0]');
			assert.isTrue(link1._observers._observers.has(observer), 'should have observer attached');
			assert.equal(observer['foo'], 'http://example.com', 'observer should have property setting Siren Entity');
			assert.equal(collection.get('foo'), link1);
		});

		it('should merge nothing due to not being a SirenLink', () => {
			const entity = SirenParse(testLinks[0]);
			const subEntity = new SirenSubEntity({ id: 'foo', token: '123' });
			const observer = { foo: 'wow' };
			subEntity.addObserver(observer, 'foo');
			collection.set('foo', subEntity);

			link1.setSirenEntity(entity, collection);

			assert.isFalse(link1._observers._observers.has(observer), 'should not have observer attached');
		});
	});
});
