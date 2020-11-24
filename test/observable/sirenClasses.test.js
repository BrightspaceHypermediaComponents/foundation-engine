import { assert }  from '@open-wc/testing';
import { SirenClasses } from '../../state/observable/SirenClasses.js';

describe('call sirenClasses methods', () => {
	it('call constructor for sirenClasses', () => {
		const obj = new SirenClasses();
		assert.isUndefined(obj.classes, 'SirenClasses value was incorrectly set');
	});

	it('value of SirenClasses is set', () => {
		const obj = new SirenClasses();
		obj.classes = 'abc';
		assert.equal(obj.classes, 'abc', 'SirenClasses value was incorrectly set');
		assert.equal(obj._observers._observers.size, 0, 'SirenClass has observer when it should not');
	});

	it('SirenClasses has an observerMap attached', () => {
		const obj = new SirenClasses();
		const comp = { foo: 'bar' };
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method });

		assert.isUndefined(obj.classes, 'value was set when it should not be');

		const map = obj._observers._observers;
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
		obj.classes = 'foo';
		obj.setSirenEntity(undefined);
		assert.isUndefined(obj.classes, 'sirenEntity was not reset');
	});

	it('sirenClasses has value updated to class of entity', () => {
		const obj = new SirenClasses();
		const entity = {};
		entity['class'] = 'bar';

		obj.classes = 'foo';
		obj.setSirenEntity(entity);

		assert.equal(obj.classes, 'bar', 'value of sirenEntity is incorrect');
	});

	it('observerMap maps to value of the sirenClasses that was set before observerMap is added', () => {
		const obj = new SirenClasses();
		const comp = {};
		const method = (val) => val;

		obj.classes = 'bar';
		obj.addObserver(comp, 'foo', { method });

		assert.equal(comp['foo'], 'bar', 'value of SirenClasses not attached to observer');
	});

	it('observerMap maps to value of the sirenClasses that was set after observerMap is added', () => {
		const obj = new SirenClasses();
		const comp = {};
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method });
		obj.classes = 'bar';

		assert.equal(comp['foo'], 'bar', 'value of SirenClasses not attached to observer');
	});

	it('observerMap maps to value of the sirenClasses that was updated', () => {
		const obj = new SirenClasses();
		const comp = {};
		const method = (val) => val;

		obj.classes = 'bar';
		obj.addObserver(comp, 'foo', { method });
		obj.classes = 'baz';

		assert.equal(comp['foo'], 'baz', 'value was not updated in observer');
	});

	it('multiple observerMaps are updated after sirenClasses value is reset', () => {
		const obj = new SirenClasses();
		const comp1 = {};
		const method1 = (val) => val;
		const comp2 = {};
		const method2 = (val) => `${val}abc`;

		obj.addObserver(comp1, 'foo', { method: method1 });
		obj.addObserver(comp2, 'fi', { method: method2 });
		obj.classes = 'baz';

		assert.equal(comp1['foo'], 'baz', 'value was not updated in first observer');
		assert.equal(comp2['fi'], 'bazabc', 'value was not updated in second observer');
	});
});
