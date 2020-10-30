import { assert }  from '@open-wc/testing';
import { Component } from '../../state/observable/Common.js';
import { SirenEntity } from '../../state/observable/SirenEntity.js';

describe('sirenEntity methods', () => {
	it('constructor called', () => {
		const obj = new SirenEntity();
		assert(!obj.sirenEntity);
	});

	it('objects entity is set', () => {
		const obj = new SirenEntity();
		obj.sirenEntity = 'abc';
		assert(obj.sirenEntity === 'abc');
		assert(obj._observers._components.size === 0);
	});

	it('observerMap is added to sirenEntity', () => {
		const obj = new SirenEntity();
		const comp = new Component();
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method });

		const map = obj._observers.components;
		assert(map.size === 1, map.size);
		assert(map.get(comp) === 'foo', map.get(comp));

		const methods = obj._observers._methods;
		assert(methods.has(comp));
		assert(methods.get(comp) === method);
		assert(comp['foo'] === undefined);
	});
});

describe('sirenEntity setting values and adding observers', () => {

	it('sirenEntity is undefined after setting sirenEntity to undefiend', () => {
		const obj = new SirenEntity();
		obj.sirenEntity = 'foo';
		obj.setSirenEntity(undefined);
		assert(!obj.sirenEntity);
	});

	it('sirenEntity is reset when setSiren is used', () => {
		const obj = new SirenEntity();
		const entity = 'bar';

		obj.sirenEntity = 'foo';
		obj.setSirenEntity(entity);

		assert(obj.sirenEntity === 'bar');
	});

	it('observer maps to value of sirenEntity set before observer was added', () => {
		const obj = new SirenEntity();
		const comp = new Component();
		const method = (val) => val;

		obj.sirenEntity = 'bar';
		obj.addObserver(comp, 'foo', { method });

		assert(comp['foo'] === 'bar');
	});

	it('observer maps to value of sirenEntity set after observer was added', () => {
		const obj = new SirenEntity();
		const comp = new Component();
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method });
		obj.sirenEntity = 'bar';

		assert(comp['foo'] === 'bar');
	});

	it('observer remaps to value of sirenEntity set after observer was added', () => {
		const obj = new SirenEntity();
		const comp = new Component();
		const method = (val) => val;

		obj.sirenEntity = 'bar';
		obj.addObserver(comp, 'foo', { method });
		assert(comp['foo'] === 'bar');

		obj.sirenEntity = 'baz';
		assert(comp['foo'] === 'baz');
	});

	it('multiple observers map to value of sirenEntity', () => {
		const obj = new SirenEntity();
		const comp1 = new Component();
		const comp2 = new Component();
		const method1 = (val) => val;
		const method2 = (val) => `${val}123`;

		obj.sirenEntity = 'bar';
		obj.addObserver(comp1, 'foo', { method: method1 });
		obj.addObserver(comp2, 'abc', { method: method2 });
		assert(comp1['foo'] === 'bar');
		assert(comp2['abc'] === 'bar123');

		obj.sirenEntity = 'baz';
		assert(comp1['foo'] === 'baz');
		assert(comp2['abc'] === 'baz123');
	});
});
