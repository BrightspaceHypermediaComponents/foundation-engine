import { assert }  from '@open-wc/testing';
import { Component } from '../../state/observable/Common.js';
import { SirenClasses } from '../../state/observable/SirenClasses.js';

describe('call sirenClasses methods', () => {
	it('call constructor for sirenClasses', () => {
		const obj = new SirenClasses();
		assert.isUndefined(obj.value, 'SirenClasses value was incorrectly set');
	});

	it('value of SirenClasses is set', () => {
		const obj = new SirenClasses();
		obj.value = 'abc';
		assert.equal(obj.value, 'abc', 'SirenClasses value was incorrectly set');
		assert.equal(obj._observers.components.size, 0, 'SirenClass has observer when it should not');
	});

	it('SirenClasses has an observerMap attached', () => {
		const obj = new SirenClasses();
		const comp = new Component();
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method });

		assert.isUndefined(obj.value, 'value was set when it should not be');

		const map = obj._observers.components;
		assert.equal(map.size, 1, 'SirenClasses has too many observers');
		assert.equal(map.get(comp), 'foo', 'observer maps to incorrect value');

		const methods = obj._observers._methods;
		assert.isTrue(methods.has(comp), 'method for observer is not stored');
		assert.equal(methods.get(comp), method, 'incorrect method stored for observer');
		assert.isUndefined(comp['foo'], 'observer applies method incorrectly');
	});
});

describe('sirenClasses setting values and adding observers', () => {

	it('sirenClasses has value removed after sirenEntity is set to undefined', () => {
		const obj = new SirenClasses();
		obj.value = 'foo';
		obj.setSirenEntity(undefined);
		assert.isUndefined(obj.value, 'sirenEntity was not reset');
	});

	it('sirenClasses has value updated to class of entity', () => {
		const obj = new SirenClasses();
		const entity = {};
		entity['class'] = 'bar';

		obj.value = 'foo';
		obj.setSirenEntity(entity);

		assert.equal(obj.value, 'bar', 'value of sirenEntity is incorrect');
	});

	it('observerMap maps to value of the sirenClasses that was set before observerMap is added', () => {
		const obj = new SirenClasses();
		const comp = new Component();
		const method = (val) => val;

		obj.value = 'bar';
		obj.addObserver(comp, 'foo', { method });

		assert.equal(comp['foo'], 'bar', 'value of SirenClasses not attached to observer');
	});

	it('observerMap maps to value of the sirenClasses that was set after observerMap is added', () => {
		const obj = new SirenClasses();
		const comp = new Component();
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method });
		obj.value = 'bar';

		assert.equal(comp['foo'], 'bar', 'value of SirenClasses not attached to observer');
	});

	it('observerMap maps to value of the sirenClasses that was updated', () => {
		const obj = new SirenClasses();
		const comp = new Component();
		const method = (val) => val;

		obj.value = 'bar';
		obj.addObserver(comp, 'foo', { method });
		obj.value = 'baz';

		assert.equal(comp['foo'], 'baz', 'value was not updated in observer');
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

		assert.equal(comp1['foo'], 'baz', 'value was not updated in first observer');
		assert.equal(comp2['fi'], 'bazabc', 'value was not updated in second observer');
	});
});
