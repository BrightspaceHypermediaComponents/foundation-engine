import { assert }  from '@open-wc/testing';
import { Component } from '../../state/observable/Common.js';
import { SirenProperty } from '../../state/observable/SirenProperty.js';

describe('SirenProperty method calls', () => {
	it('call constructor for SirenProperty with empty object', () => {
		const obj = new SirenProperty({});
		assert(!obj.property);
	});

	it('objects property based on id', () => {
		const obj = new SirenProperty({ id: '_name' });
		assert(obj.property === '_name');
	});

	it('observerMap with method added SirenProperty', () => {
		const obj = new SirenProperty({ id: '_field' });
		const comp = new Component();
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method });

		const map = obj._observers.components;
		assert(map.size === 1, map.size);
		assert(map.get(comp) === 'foo', map.get(comp));

		const methods = obj._observers._methods;
		assert(!methods.has(comp));
		assert(comp['foo'] === undefined);
	});
});

describe('sirenProperty definedProperty', () => {
	it('property id based on object name', () => {
		const obj = { name: 'hello' };
		const res = SirenProperty.definedProperty(obj);

		assert(res.id === 'hello');
	});

	it('property id based on object id', () => {
		const obj = { id: 'hello' };
		const res = SirenProperty.definedProperty(obj);

		assert(res.id === 'hello');
	});

	it('property id based on object id. underscores not removed', () => {
		const obj = { id: '__hello' };
		const res = SirenProperty.definedProperty(obj);

		assert(res.id === '__hello');
	});

	it('property id based on object with id and name. objects id value is used', () => {
		const obj = { id: 'thisIsID', name: 'thisIsName' };
		const res = SirenProperty.definedProperty(obj);

		assert(res.id === 'thisIsID');
	});

	it('property id based on object with name. leading underscore from name removed', () => {
		const obj = { name: '_hello' };
		const res = SirenProperty.definedProperty(obj);

		assert(res.id === 'hello');
	});

	it('property id based on object with name. multiple leading underscores from name removed', () => {
		const obj = { name: '___hello' };
		const res = SirenProperty.definedProperty(obj);

		assert(res.id === 'hello');
	});

	it('property id based on object with name. nonleading underscores remain', () => {
		const obj = { name: '_i_am_a_snake' };
		const res = SirenProperty.definedProperty(obj);

		assert(res.id === 'i_am_a_snake');
	});
});

describe('sirenProperty setting values', () => {

	it('value is not set due to undefined entity', () => {
		const obj = new SirenProperty({});
		obj.setSirenEntity(undefined);
		assert(!obj.value);
	});

	it('value is not set due to entity without properties', () => {
		const obj = new SirenProperty({});
		const entity = {};
		obj.setSirenEntity(entity);
		assert(!obj.value);
	});

	it('value is not set due to properties not matching id', () => {
		const obj = new SirenProperty({ id: '_name' });
		const entity = { properties: {} };
		entity.properties['_notName'] = 'foo';
		obj.setSirenEntity(entity);
		assert(!obj.value);
	});

	it('value is set to properties matching id', () => {
		const obj = new SirenProperty({ id: '_name' });
		const entity = { properties: {} };
		entity.properties['_name'] = 'foo';
		obj.setSirenEntity(entity);
		assert(obj.value === 'foo');
	});
});
