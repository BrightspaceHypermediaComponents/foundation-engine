import { assert }  from '@open-wc/testing';
import { SirenSubEntities } from '../../state/observable/SirenSubEntities.js';

describe.only('subEntities basic methods', () => {
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

describe.only('sirenSubEntities set sirenEntity', () =>  {
	it('childSubEntites are removed when empty sirenEntity is added', () => {
		const subentites = new SirenSubEntities({ id: 'abc', token: '1234', state: 'hello' });
		const sub = new SirenSubEntities();
		subentites.setSirenEntity(sub);

		assert(subentites.childSubEntities.size, 0);
	});
});
