import { assert }  from '@open-wc/testing';
//import { SirenClasses } from '../../state/observable/SirenClasses.js';
import SirenParse from 'siren-parser';
import { SirenSubEntity } from '../../state/observable/SirenSubEntity.js';
import { subEntityTests } from '../data/observable/entities.js';

describe('sirenSubEntity method tests', () => {
	describe('construction, settors, and gettors', () => {
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

		it('should set entityID', () => {
			const sub = new SirenSubEntity({ id: 'foo', token: 'bar' });
			sub.entityID = 'baz';

			assert.equal(sub.rel, 'foo', 'subEntity rel field initialized incorrectly');
			assert.equal(sub._token, 'bar', 'subEntity token field initialized incorrectly');
			assert.equal(sub.entityID, 'baz', 'subEntity rel field set incorrectly');
			assert.instanceOf(sub._routes, Map, 'routes should be a Map');
			assert.equal(sub._routes.size, 0, 'subEntity routes should be empty when constructed');
		});
	});

	describe('adding and removing observers', () => {
		let subentity, obs;

		beforeEach(() => {
			subentity = new SirenSubEntity({ id: 'foo', token: 'bar' });
			obs = { foo: undefined };
		});

		it('should add an object with route', () => {
			subentity.addObserver(obs, 'hello', { route: { value: 'abcde' } });

			const map = subentity._observers._observers;
			assert.equal(map.size, 0, 'SirenSubEntity has incorrect number of observers');

			const routes = subentity._routes;
			assert.equal(routes.size, 1, 'incorrect number of routes stored in observer');
			assert.equal(routes.get(obs).value, 'abcde', 'route set incorrectly for observer');

			const methods = subentity._observers._methods;
			assert.isFalse(methods.has(obs), 'method for observer is not stored');
		});

		it('should remove an object with a route', () => {
			subentity.addObserver(obs, 'hello', { route: 'abcde' });
			subentity.deleteObserver(obs);

			const map = subentity._observers._observers;
			assert.equal(map.size, 0, 'SirenSubEntity has incorrect number of observers');

			const routes = subentity._routes;
			assert.equal(routes.size, 0, 'incorrect number of routes stored in observer');
		});

		it('should add an object without a route', () => {
			subentity.addObserver(obs, 'hello');

			const map = subentity._observers._observers;
			assert.equal(map.size, 1, 'SirenSubEntity has incorrect number of observers');
			assert.equal(map.get(obs), 'hello');

			const routes = subentity._routes;
			assert.equal(routes.size, 0, 'incorrect number of routes stored in observer');
		});

		it('should remove an object without a route', () => {
			subentity.addObserver(obs, 'hello');
			subentity.deleteObserver(obs);

			const map = subentity._observers._observers;
			assert.equal(map.size, 0, 'SirenSubEntity has incorrect number of observers');

			const routes = subentity._routes;
			assert.equal(routes.size, 0, 'incorrect number of routes stored in observer');
		});

	});

	describe('setSirenEntity', () => {
		// subEntityTests are imported from ../data/observable/entities.js for testing
		let subEntity1, collection;
		beforeEach(() => {
			collection = new Map();
			subEntity1 = new SirenSubEntity({ id: 'foo', token: 'bar' });
		});

		it('should update SirenSubEntitys href to be the href from test data', () => {
			const entity = SirenParse(subEntityTests.entityWithHref);

			subEntity1.setSirenEntity(entity);

			assert.equal(subEntity1.entity.href, 'www.foo.com', 'should be updated by to test data');
		});

		it('should update SirenSubEntitys href to be the href from link in test data', () => {
			const entity = SirenParse(subEntityTests.entityWithoutHref);

			subEntity1.setSirenEntity(entity);

			assert.equal(subEntity1.entity.href, 'www.subentity.com', 'should be href from entity without href link');
		});

		it('should not update SirenSubEntity', () => {
			const entity = SirenParse(subEntityTests.barEntity);

			subEntity1.setSirenEntity(entity);

			assert.isUndefined(subEntity1.entity, 'should be unset by entity not matching property');
			assert.instanceOf(collection, Map);
		});

		it('should merge observer from collection entity into subEntity1', () => {
			const entity = SirenParse(subEntityTests.entityWithHref);
			const subentity2 = new SirenSubEntity({ id: 'foo', token: '123' });
			const observer = { foo: 'bar' };
			subentity2.addObserver(observer, 'foo');
			collection.set('foo', subentity2);

			assert.equal(observer['foo'], 'bar', 'observer should have property set to initial value');

			subEntity1.setSirenEntity(entity, collection);

			assert.equal(subEntity1.entity.href, 'www.foo.com', 'should be href from entityWithHref');
			assert.isTrue(subEntity1._observers._observers.has(observer), 'should have observer attached');
			assert.equal(observer['foo'].href, 'www.foo.com', 'observer should have property setting Siren Entity');
			assert.deepEqual(observer['foo'].rel, [ 'foo' ], 'observer should have property setting Siren Entity');
			assert.equal(collection.get('foo'), subEntity1, 'collection should be updated to store subEntity1');
		});
	});
});
