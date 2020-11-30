import { assert }  from '@open-wc/testing';
import SirenParse from 'siren-parser';
import { SirenSubEntities } from '../../state/observable/SirenSubEntities.js';
import { SirenSubEntity } from '../../state/observable/SirenSubEntity.js';
import { testSubEntities } from './entities.js';

describe('subEntities basic methods', () => {
	beforeEach(() => {

	});

	it('sirenSubEntites constructed from empty object', () => {
		const obj = new SirenSubEntities();

		assert.isUndefined(obj._state, 'subEntities state initialized by empty object');
		assert.isUndefined(obj.rel, 'subEntities rel initialized by empty object');
		assert.isUndefined(obj._token, 'subEntities token initialized by empty object');
		assert.instanceOf(obj.childSubEntities, Map, 'subEntities children should be a map');
		assert.isArray(obj.entityIDs, 'subEntities entityIDs should be empty list');
		assert.isEmpty(obj.entityIDs, 'subEntites enitityIDS should start empty');
	});

	it('sirenSubEntites constructed from non-empty object', () => {
		const obj = new SirenSubEntities({ id: 'abc', token: '1234', state: 'hello' });

		assert.equal(obj._state, 'hello', 'subEntities state should be initialized');
		assert.equal(obj.rel, 'abc', 'subEntities rel should be initialized');
		assert.equal(obj._token, '1234', 'subEntities token should be initialized');
		assert.instanceOf(obj.childSubEntities, Map, 'subEntities children should be a map');
		assert.isArray(obj.entityIDs, 'subEntities entityIDs should be empty list');
		assert.isEmpty(obj.entityIDs, 'subEntites enitityIDS should start empty');
	});
});

describe('sirenSubEntities set sirenEntity', () =>  {
	// testSubEntites are imported from ./entities.js for testing
	it('entity with zero matching ids has been added as subentity', () => {
		const subentites = new SirenSubEntities({ id: 'foo', token: '1234', state: 'hello' });
		const entity = SirenParse(testSubEntities[1]);

		subentites.setSirenEntity(entity);

		assert.equal(subentites.childSubEntities.size, 0, 'SirenSubEntities should have 0 children');
		assert.deepEqual(subentites.entityIDs, [], 'SirenSubEntities should have 0 entityIDs');
	});

	it('entity with one matching id has been added as subentity', () => {
		const subentites = new SirenSubEntities({ id: 'foo', token: '1234', state: 'hello' });
		const entity = SirenParse(testSubEntities[0]);

		subentites.setSirenEntity(entity);

		assert.equal(subentites.childSubEntities.size, 1, 'SirenSubEntities should have 1 child');
		assert.isTrue(subentites.childSubEntities.has('www.abc.com'), 'SirenSubEntities should have child stored');
		const addedSubentity = subentites.childSubEntities.get('www.abc.com');
		assert.instanceOf(addedSubentity, SirenSubEntity, 'SirenSubEntities child should be a SirenSubEntity');
		assert.deepEqual(subentites.entityIDs, ['www.abc.com'], 'SirenSubEntities entityIDs should store one href');
	});

	it('entity with two matching ids has been added as subentity', () => {
		const subentites = new SirenSubEntities({ id: 'foo', token: '1234', state: 'hello' });
		const entity = SirenParse(testSubEntities[2]);

		subentites.setSirenEntity(entity);

		assert.equal(subentites.childSubEntities.size, 2, 'SirenSubEntities should have 2 children');
		assert.isTrue(subentites.childSubEntities.has('www.def.com'), 'SirenSubEntities should store first child');
		assert.isTrue(subentites.childSubEntities.has('www.xyz.com'), 'SirenSubEntities should store second child');
		assert.deepEqual(subentites.entityIDs, ['www.def.com', 'www.xyz.com'], 'SirenSubEntities entityIDs should store two hrefs');
	});

	it('entity with two matching ids overwritten with one id', () => {
		const subentites = new SirenSubEntities({ id: 'foo', token: '1234', state: 'hello' });
		const entity1 = SirenParse(testSubEntities[2]);
		const entity2 = SirenParse(testSubEntities[0]);

		subentites.setSirenEntity(entity1);
		subentites.setSirenEntity(entity2);

		assert.equal(subentites.childSubEntities.size, 1, 'SirenSubEntities should have 1 child');
		assert.isTrue(subentites.childSubEntities.has('www.abc.com'), 'SirenSubEntities should have child stored');
		assert.deepEqual(subentites.entityIDs, ['www.abc.com'], 'SirenSubEntities entityIDs should store one href');
	});
});
