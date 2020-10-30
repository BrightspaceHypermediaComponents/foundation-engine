import { assert }  from '@open-wc/testing';
import { Component } from '../../state/observable/Common.js';
import { SirenClasses } from '../../state/observable/SirenClasses.js';

describe('call sirenClasses methods', () => {
	it('call constructor for sirenClasses', () => {
		const obj = new SirenClasses();
		assert(!obj.value);
	});

	it('value of SirenClasses is set', () => {
		const obj = new SirenClasses();
		obj.value = 'abc';
		assert(obj.value === 'abc');
	});

	it('SirenClasses has an observerMap attached', () => {
		const obj = new SirenClasses();
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

describe('sirenClasses setting values and adding observers', () => {

	it('sirenClasses has value removed after sirenEntity is set to undefined', () => {
		const obj = new SirenClasses();
		obj.value = 'foo';
		obj.setSirenEntity(undefined);
		assert(!obj.value);
	});

	it('sirenClasses has value updated to class of entity', () => {
		const obj = new SirenClasses();
		const entity = {};
		entity['class'] = 'bar';

		obj.value = 'foo';
		obj.setSirenEntity(entity);

		assert(obj.value === 'bar');
	});

	it('observerMap maps to value of the sirenClasses that was set before observerMap is added', () => {
		const obj = new SirenClasses();
		const comp = new Component();
		const method = (val) => val;

		obj.value = 'bar';
		obj.addObserver(comp, 'foo', { method });

		assert(comp['foo'] === 'bar');
	});

	it('observerMap maps to value of the sirenClasses that was set after observerMap is added', () => {
		const obj = new SirenClasses();
		const comp = new Component();
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method });
		obj.value = 'bar';

		assert(comp['foo'] === 'bar');
	});

	it('observerMap maps to value of the sirenClasses that was updated', () => {
		const obj = new SirenClasses();
		const comp = new Component();
		const method = (val) => val;

		obj.value = 'bar';
		obj.addObserver(comp, 'foo', { method });
		obj.value = 'baz';

		assert(comp['foo'] === 'baz');
	});

	it('multiple observerMaps are updated after sirenClasses value is reset', () => {
		const obj = new SirenClasses();
		const comp1 = new Component();
		const method1 = (val) => val;
		const comp2 = new Component();
		const method2 = (val) => `${val}abc`;

		obj.addObserver(comp1, 'foo', { method: method1 });
		obj.addObserver(comp2, 'fi', { method: method2 });
		obj.value = 'baz';

		assert(comp1['foo'] === 'baz');
		assert(comp2['fi'] === 'bazabc');
	});
});
