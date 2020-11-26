import { assert }  from '@open-wc/testing';
import { SirenProperty } from '../../state/observable/SirenProperty.js';

describe('SirenProperty method calls', () => {
	it('call constructor for SirenProperty with empty object', () => {
		const obj = new SirenProperty({});
		assert.isUndefined(obj.property, 'property made from empty object');
	});

	it('objects property based on id', () => {
		const obj = new SirenProperty({ id: '_name' });
		assert.equal(obj.property, '_name', 'property ID was not set');
	});

	it('observerMap with method added SirenProperty', () => {
		const obj = new SirenProperty({ id: '_field' });
		const comp = { foo: undefined };
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method });

		const map = obj._observers._observers;
		assert.equal(map.size, 1, 'property has incorrect number of observers');
		assert.equal(map.get(comp), 'foo', 'property has incorrect value');

		const methods = obj._observers._methods;
		assert.isTrue(methods.has(comp), 'observer should have a method for the object');
		assert.isUndefined(comp['foo'],  'property maps to incorrect value in observer');
	});
});

describe('sirenProperty definedProperty', () => {
	it('property id based on object name', () => {
		const obj = { name: 'hello' };
		const res = SirenProperty.definedProperty(obj);

		assert.equal(res.id, 'hello', 'property id was not set by object name field');
	});

	it('property id based on object id', () => {
		const obj = { id: 'hello' };
		const res = SirenProperty.definedProperty(obj);

		assert.equal(res.id, 'hello', 'property id was not set by object id');
	});

	it('property id based on object id. underscores not removed', () => {
		const obj = { id: '__hello' };
		const res = SirenProperty.definedProperty(obj);

		assert.equal(res.id, '__hello', 'property id with underscores was not set by object id');
	});

	it('property id based on object with id and name. objects id value is used', () => {
		const obj = { id: 'thisIsID', name: 'thisIsName' };
		const res = SirenProperty.definedProperty(obj);

		assert.equal(res.id, 'thisIsID');
	});

	it('property id based on object with name. leading underscore from name removed', () => {
		const obj = { name: '_hello' };
		const res = SirenProperty.definedProperty(obj);

		assert.equal(res.id, 'hello', 'property id set incorrectly from name with leading underscore');
	});

	it('property id based on object with name. multiple leading underscores from name removed', () => {
		const obj = { name: '___hello' };
		const res = SirenProperty.definedProperty(obj);

		assert.equal(res.id, 'hello', 'property id set incorrectly from name with multiple leading underscores');
	});

	it('property id based on object with name. nonleading underscores remain', () => {
		const obj = { name: '_i_am_a_snake' };
		const res = SirenProperty.definedProperty(obj);

		assert.equal(res.id, 'i_am_a_snake', 'property id set incorrectly from name in snake_case with leading underscore');
	});
});

describe('sirenProperty setting values', () => {

	it('value is not set due to undefined entity', () => {
		const obj = new SirenProperty({});
		obj.setSirenEntity(undefined);

		assert.isUndefined(obj.value, 'property value is set incorrectly when explicitly set to undefined');
	});

	it('value is not set due to entity without properties', () => {
		const obj = new SirenProperty({});
		const entity = {};

		obj.setSirenEntity(entity);

		assert.isUndefined(obj.value, 'property value is set from empty object');
	});

	it('value is not set due to properties not matching id', () => {
		const obj = new SirenProperty({ id: '_name' });
		const entity = { properties: {} };
		entity.properties['_notName'] = 'foo';

		obj.setSirenEntity(entity);

		assert.isUndefined(obj.value, 'property value is set when object has incorrect property');
	});

	it('value is set to properties matching id', () => {
		const obj = new SirenProperty({ id: '_name' });
		const entity = { properties: {} };
		entity.properties['_name'] = 'foo';

		obj.setSirenEntity(entity);

		assert.equal(obj.value, 'foo', 'property value is unset when object has _name property');
	});
});
