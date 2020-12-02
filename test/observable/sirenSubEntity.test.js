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
