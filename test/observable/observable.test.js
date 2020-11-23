import { assert }  from '@open-wc/testing';
import { Observable } from '../../state/observable/Observable.js';
import { ObserverMap } from '../../state/observable/ObserverMap.js';

describe.only('Observable methods', () => {
	it('Observable constructed from empty object', () => {
		const obj = new Observable({});
		assert(obj instanceof Observable, 'Observable was not created');
		assert.instanceOf(obj._observers, ObserverMap, 'observer field should be an ObserverMap');
		assert.isUndefined(obj._state, 'state should be uninitialixed');
	});

	it('methods of observable is empty when no method added', () => {
		const comp = new ObserverMap();
		const obj = new Observable({});

		obj.addObserver(comp, 'foo', {});

		const map = obj._observers._observers;
		assert(map.size === 1, 'Observable should have exactly one observerMap');
		assert(map.get(comp) === 'foo', 'ObserverMap does not map to foo');

		const methods = obj._observers._methods;
		assert.isFalse(methods.has(comp), 'observer maps to a method');
		assert.equal(comp._observers.size, 0, 'ObserverMap is non-empty');
	});

	it('methods of observable contains method and observerMap uses method with property unset', () => {
		const comp = new ObserverMap();
		const obj = new Observable({});
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method });

		const map = obj._observers._observers;
		assert.equal(map.size, 1, 'Observable does not have exactly one observerMap');
		assert.equal(map.get(comp), 'foo', 'foo is not mapped from observerMap');

		const methods = obj._observers._methods;
		assert.isTrue(methods.has(comp), 'added ObserverMap is not associated with a method');
		assert.equal(methods.get(comp), method, 'added ObserverMap is not associated with correct method');
		assert.isUndefined(comp['foo'], 'ObserverMap incorrectly maps the output of method');
	});

	it('methods of observable contains method and observerMap uses method with property set', () => {
		const comp = new ObserverMap();
		comp.setProperty('bar');
		const obj = new Observable({});
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method });

		const map = obj._observers._observers;
		assert.equal(map.size, 1, 'Observable does not have exactly one observerMap');
		assert.equal(map.get(comp), 'foo', 'foo is not mapped from observerMap');

		const methods = obj._observers._methods;
		assert.isTrue(methods.has(comp), 'added ObserverMap is not associated with a method');
		assert.equal(methods.get(comp), method, 'added ObserverMap is not associated with correct method');
		assert.equal(comp['foo'], 'bar', 'ObserverMap should map foo to bar');
	});

	it('observerMap is removed from Observable when deleted from object', () => {
		const comp = new ObserverMap();
		const obj = new Observable({});

		obj.addObserver(comp, 'foo', {});
		obj.deleteObserver(comp);

		const map = obj._observers._observers;
		assert.equal(map.size, 0, 'Observable has observer after it has been removed');
	});

	it('observerMap is removed from Observable when deleted from object, component mapping still exists', () => {
		const comp = new ObserverMap();
		comp.setProperty('bar');
		const obj = new Observable({});
		const method = (val) => `${val}1`;

		obj.addObserver(comp, 'foo', { method });
		obj.deleteObserver(comp);

		const map = obj._observers._observers;
		assert.equal(map.size, 0, 'Observable has observer after it has been removed');

		const methods = obj._observers._methods;
		assert.isFalse(methods.has(comp), 'observer method tracked after observer is removed');
	});
});

describe.only('create observable multiple components', () => {
	it('observable contains two components without methods', () => {
		const comp1 = new ObserverMap();
		const comp2 = new ObserverMap();
		const obj = new Observable({});

		obj.addObserver(comp1, 'foo', {});
		obj.addObserver(comp2, 'abc', {});

		const map = obj._observers._observers;
		assert.equal(map.size, 2, 'an observer is missing after two unique observers added');
		assert.equal(map.get(comp1), 'foo', 'first observer maps the the wrong value');
		assert.equal(map.get(comp2), 'abc', 'second observer maps to the wrong value');

		const methods = obj._observers._methods;
		assert.isFalse(methods.has(comp1), 'method stored for first observer');
		assert.isFalse(methods.has(comp2), 'method stored for second observer');
		assert.equal(comp1._observers.size, 0, 'first observer stores an observer');
		assert.equal(comp2._observers.size, 0, 'second observer stores an observer');
	});

	it('observable contains second observerMap after first observerMap is removed', () => {
		const comp1 = new ObserverMap();
		const comp2 = new ObserverMap();
		const obj = new Observable({});

		obj.addObserver(comp1, 'foo', {});
		obj.addObserver(comp2, 'abc', {});
		obj.deleteObserver(comp1);

		const map = obj._observers._observers;
		assert.equal(map.size, 1, 'observer count is not one after first observer removed');
		assert.isFalse(map.has(comp1), 'first observer was not removed');
		assert.equal(map.get(comp2), 'abc', 'second observer maps incorrectly');
	});

	it('observable contains first observerMap after second observerMap is removed', () => {
		const comp1 = new ObserverMap();
		const comp2 = new ObserverMap();
		const obj = new Observable({});

		obj.addObserver(comp1, 'foo', {});
		obj.addObserver(comp2, 'abc', {});
		obj.deleteObserver(comp2);

		const map = obj._observers._observers;
		assert.equal(map.size, 1, 'observer count is not one after second observer removed');
		assert.equal(map.get(comp1), 'foo', 'first observer maps incorrectly');
		assert.isFalse(map.has(comp2), 'second observer was not removed from observable');
	});

	it('observable is not updated when component is added a second time', () => {
		const comp1 = new ObserverMap();
		const obj = new Observable({});

		obj.addObserver(comp1, 'foo', {});
		obj.addObserver(comp1, 'abc', {});

		const map = obj._observers._observers;
		assert.equal(map.size, 1, 'observer count is not one after same component is added twice');
		assert.equal(map.get(comp1), 'foo', 'observer does not map to first value assigned');
	});

	it('observable contains two components with different data', () => {
		const comp1 = new ObserverMap();
		comp1.setProperty('bar');
		const method1 = (val) => `${val}1`;
		const comp2 = new ObserverMap();
		comp2.setProperty('');
		const method2 = (val) => `${val}xyz`;
		const obj = new Observable({});

		obj.addObserver(comp1, 'foo', { method: method1 });
		obj.addObserver(comp2, 'abc', { method: method2 });

		const map = obj._observers._observers;
		assert.equal(map.size, 2, 'Observable has incorrect number of observers');
		assert.equal(map.get(comp1), 'foo', 'first observer contains wrong value');
		assert.equal(map.get(comp2), 'abc', 'second observer contains wrong value');

		const methods = obj._observers._methods;
		assert.isTrue(methods.has(comp1), 'method for first observer not stored');
		assert.equal(methods.get(comp1), method1, 'incorrect method stored for first observer');
		assert.equal(comp1.value, 'bar', 'test');
		assert.equal(comp1['foo'], 'bar1', 'first observer maps to wrong value');

		assert.isTrue(methods.has(comp2), 'method for second observer not stored');
		assert.equal(methods.get(comp2), method2, 'incorrect method stored for second observer');
		assert.equal(comp2['abc'], 'xyz', 'second observer maps to wrong value');
	});

	it('observable contains one components with method after one is removed', () => {
		const comp1 = new ObserverMap();
		comp1.setProperty('bar');
		const method1 = (val) => `${val}1`;

		const comp2 = new ObserverMap();
		comp2.setProperty('');
		const method2 = (val) => `${val}xyz`;

		const obj = new Observable({});

		obj.addObserver(comp1, 'foo', { method: method1 });
		obj.addObserver(comp2, 'abc', { method: method2 });
		obj.deleteObserver(comp1);

		const map = obj._observers._observers;
		assert.equal(map.size, 1, 'incorrect number of observers after deletion');
		assert.isFalse(map.has(comp1), 'first observer not removed');
		assert.equal(map.get(comp2), 'abc', 'second observer maps to incorrect value');

		const methods = obj._observers._methods;
		assert.isFalse(methods.has(comp1), 'method for first observer was not removed');
		assert.equal(comp1['foo'], 'bar1', 'first observer maps to wrong value');
		assert.isTrue(methods.has(comp2), 'method for second observer should exist');
		assert.equal(methods.get(comp2), method2, 'method for second observer is incorrect method');
		assert.equal(comp2['abc'], 'xyz', 'second observer applies method incorrectly');
	});
});
