import { assert }  from '@open-wc/testing';
import { Component } from '../../state/observable/Common.js';
import { Observable } from '../../state/observable/Observable.js';

describe('Observable methods', () => {
	it('call Observable constructor', () => {
		const obj = new Observable();
		assert(obj._observers instanceof Component);
	});

	it('methods of observable is empty when no method added', () => {
		const comp = new Component();
		const obj = new Observable();

		obj.addObserver(comp, 'foo', {}, false);

		const map = obj._observers.components;
		assert(map.size === 1, map.size);
		assert(map.get(comp) === 'foo', map.get(comp));
		const methods = obj._observers._methods;
		assert(!methods.has(comp));
		assert(comp.components.size === 0);
	});

	it('methods of observable contains method and observerMap uses method', () => {
		const comp = new Component();
		const obj = new Observable();
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method }, 'bar');

		const map = obj._observers.components;
		assert(map.size === 1, map.size);
		assert(map.get(comp) === 'foo', map.get(comp));

		const methods = obj._observers._methods;
		assert(methods.has(comp));
		assert(methods.get(comp) === method);
		assert(comp['foo'] === 'bar');
	});

	it('observerMap is removed from Observable when deleted from object', () => {
		const comp = new Component();
		const obj = new Observable();

		obj.addObserver(comp, 'foo', {}, false);
		obj.deleteObserver(comp);

		const map = obj._observers.components;
		assert(map.size === 0, map.size);
	});

	it('observerMap is removed from Observable when deleted from object, component mapping still exists', () => {
		const comp = new Component();
		const obj = new Observable();
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method }, 'bar');
		obj.deleteObserver(comp);

		const map = obj._observers.components;
		assert(map.size === 0, map.size);

		const methods = obj._observers._methods;
		assert(!methods.has(comp));
		assert(comp['foo'] === 'bar');
	});
});

describe('create observable multiple components', () => {
	it('observable contains two components without methods', () => {
		const comp1 = new Component();
		const comp2 = new Component();
		const obj = new Observable();

		obj.addObserver(comp1, 'foo', {}, false);

		const map = obj._observers.components;
		assert(map.size === 1, map.size);
		assert(map.get(comp1) === 'foo', map.get(comp1));
		let methods = obj._observers._methods;
		assert(!methods.has(comp1));
		assert(comp1.components.size === 0);

		obj.addObserver(comp2, 'abc', {}, 'xyz');
		const map2 = obj._observers.components;
		assert(map2.size === 2, map.size);
		assert(map2.get(comp1) === 'foo', map.get(comp1));
		assert(map2.get(comp2) === 'abc', map.get(comp2));
		methods = obj._observers._methods;
		assert(!methods.has(comp1));
		assert(!methods.has(comp2));
		assert(comp1.components.size === 0);
		assert(comp2.components.size === 0);
	});

	it('observable contains second observerMap after first observerMap is removed', () => {
		const comp1 = new Component();
		const comp2 = new Component();
		const obj = new Observable();

		obj.addObserver(comp1, 'foo', {}, false);
		obj.addObserver(comp2, 'abc', {}, 'xyz');
		obj.deleteObserver(comp1);

		const map = obj._observers.components;
		assert(map.size === 1, map.size);
		assert(!map.has(comp1), map.get(comp1));
		assert(map.get(comp2) === 'abc', map.get(comp2));

		const methods = obj._observers._methods;
		assert(!methods.has(comp1));
		assert(!methods.has(comp2));
		assert(comp1.components.size === 0);
		assert(comp2.components.size === 0);
	});

	it('observable contains first observerMap after second observerMap is removed', () => {
		const comp1 = new Component();
		const comp2 = new Component();
		const obj = new Observable();

		obj.addObserver(comp1, 'foo', {}, false);
		obj.addObserver(comp2, 'abc', {}, 'xyz');
		obj.deleteObserver(comp2);

		const map = obj._observers.components;
		assert(map.size === 1, map.size);
		assert(map.get(comp1) === 'foo', map.get(comp1));
		assert(!map.has(comp2), map.get(comp2));

		const methods = obj._observers._methods;
		assert(!methods.has(comp1));
		assert(!methods.has(comp2));
		assert(comp1.components.size === 0);
		assert(comp2.components.size === 0);
	});

	it('observable is not updated when component is added a second time', () => {
		const comp1 = new Component();
		const obj = new Observable();

		obj.addObserver(comp1, 'foo', {}, false);
		obj.addObserver(comp1, 'abc', {}, 'xyz');

		const map = obj._observers.components;
		assert(map.size === 1, map.size);
		assert(map.get(comp1) === 'foo', map.get(comp1));

		const methods = obj._observers._methods;
		assert(!methods.has(comp1));
		assert(comp1.components.size === 0);
	});

	it('observable contains two components with different data', () => {
		const comp1 = new Component();
		const method1 = (val) => val;
		const comp2 = new Component();
		const method2 = (val) => `${val}xyz`;
		const obj = new Observable();

		obj.addObserver(comp1, 'foo', { method: method1 }, 'bar');
		obj.addObserver(comp2, 'abc', { method: method2 }, '');

		const map = obj._observers.components;
		assert(map.size === 2);
		assert(map.get(comp1) === 'foo');
		assert(map.get(comp2) === 'abc');

		const methods = obj._observers._methods;
		assert(methods.has(comp1));
		assert(methods.get(comp1) === method1);
		assert(comp1['foo'] === 'bar');
		assert(methods.has(comp2));
		assert(methods.get(comp2) === method2);
		assert(comp2['abc'] === 'xyz');
	});

	it('observable contains one components with method after one is removed', () => {
		const comp1 = new Component();
		const method1 = (val) => val;

		const comp2 = new Component();
		const method2 = (val) => `${val}xyz`;

		const obj = new Observable();

		obj.addObserver(comp1, 'foo', { method: method1 }, 'bar');
		obj.addObserver(comp2, 'abc', { method: method2 }, '');
		obj.deleteObserver(comp1);

		const map = obj._observers.components;
		assert(map.size === 1);
		assert(!map.has(comp1));
		assert(map.get(comp2) === 'abc');

		const methods = obj._observers._methods;
		assert(!methods.has(comp1));
		assert(comp1['foo'] === 'bar');
		assert(methods.has(comp2));
		assert(methods.get(comp2) === method2);
		assert(comp2['abc'] === 'xyz');
	});
});
