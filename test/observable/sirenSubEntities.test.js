import { assert }  from '@open-wc/testing';
import { default as SirenParse } from 'siren-parser';
import { SirenSubEntities } from '../../state/observable/SirenSubEntities.js';
import { SirenSubEntity } from '../../state/observable/SirenSubEntity.js';
import { subEntitiesTests } from '../data/observable/entities.js';

describe('subEntities basic methods', () => {
	it('sirenSubEntities constructed from empty object', () => {
		const obj = new SirenSubEntities({});

		assert.isUndefined(obj._state, 'subEntities state initialized by empty object');
		assert.isUndefined(obj.rel, 'subEntities rel initialized by empty object');
		assert.isUndefined(obj._token, 'subEntities token initialized by empty object');
		assert.instanceOf(obj.entityMap, Map, 'subEntities children should be a map');
		assert.isArray(obj.entities, 'subEntities entities should be array type');
		assert.isEmpty(obj.entities, 'subEntities list should start empty');
	});

	it('sirenSubEntites constructed from non-empty object', () => {
		const obj = new SirenSubEntities({ id: 'abc', token: '1234', state: 'hello' });

		assert.equal(obj._state, 'hello', 'subEntities state should be initialized');
		assert.equal(obj.rel, 'abc', 'subEntities rel should be initialized');
		assert.equal(obj._token, '1234', 'subEntities token should be initialized');
		assert.instanceOf(obj.entityMap, Map, 'subEntities children should be a map');
		assert.isArray(obj.entities, 'subEntities entities should be an array type');
		assert.isEmpty(obj.entities, 'subEntities list should start empty');
	});
});

describe('sirenSubEntities set sirenEntity', () =>  {
	const state = {
		createRoutedState: () => {
			return {
				setSirenEntity: (entity) => entity
			};
		}
	};
	// testSubEntites are imported from ../data/observable/entities.js for testing
	it('entity with zero matching ids has been added as subentity', async() => {
		const subentites = new SirenSubEntities({ id: 'foo', state });
		const entity = SirenParse(subEntitiesTests.barEntity);

		await subentites.setSirenEntity(entity);

		assert.equal(subentites.entityMap.size, 0, 'SirenSubEntities should have 0 children');
		assert.deepEqual(subentites.entities, [], 'SirenSubEntities should have 0 entities');
	});

	it('entity with one matching id has been added as subentity', async() => {
		const subentites = new SirenSubEntities({ id: 'foo', state });
		const entity = SirenParse(subEntitiesTests.fooEntity);

		await subentites.setSirenEntity(entity);

		assert.equal(subentites.entityMap.size, 1, 'SirenSubEntities should have 1 child');
		assert.isTrue(subentites.entityMap.has('www.abc.com'), 'SirenSubEntities should have child stored');
		const addedSubentity = subentites.entityMap.get('www.abc.com');
		assert.instanceOf(addedSubentity, SirenSubEntity, 'SirenSubEntities child should be a SirenSubEntity');
	});

	it('entity with two matching ids has been added as subentity', async() => {
		const subentites = new SirenSubEntities({ id: 'foo', state });
		const entity = SirenParse(subEntitiesTests.multipleSubEntities);

		await subentites.setSirenEntity(entity);

		assert.equal(subentites.entityMap.size, 2, 'SirenSubEntities should have 2 children');
		assert.isTrue(subentites.entityMap.has('www.def.com'), 'SirenSubEntities should store first child');
		assert.isTrue(subentites.entityMap.has('www.xyz.com'), 'SirenSubEntities should store second child');
	});

	it('entity with two matching ids overwritten with one id', async() => {
		const subentites = new SirenSubEntities({ id: 'foo', state });
		const entity1 = SirenParse(subEntitiesTests.multipleSubEntities);
		const entity2 = SirenParse(subEntitiesTests.fooEntity);

		await subentites.setSirenEntity(entity1);
		await subentites.setSirenEntity(entity2);

		assert.equal(subentites.entityMap.size, 1, 'SirenSubEntities should have 1 child');
		assert.isTrue(subentites.entityMap.has('www.abc.com'), 'SirenSubEntities should have child stored');
	});
});
