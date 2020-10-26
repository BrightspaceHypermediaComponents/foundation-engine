import { assert }  from '@open-wc/testing';
import { Component } from '../../state/observable/Common.js';
import { Observable } from '../../state/observable/Observable.js';

describe('Observable methods', () => {
	it('addObserver without method', () => {
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
	it('addObserver with method', () => {
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
	it('deleteObserver without method', () => {
		const comp = new Component();
		const obj = new Observable();
		obj.addObserver(comp, 'foo', {}, false);
		obj.deleteObserver(comp);
		const map = obj._observers.components;
		assert(map.size === 0, map.size);
	});
	it('deleteObserver with method', () => {
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
describe('observable multiple components', () => {
	it('addObserver two components', () => {
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
	it('addObserver two components, delete first', () => {
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
	it('addObserver two components, delete second', () => {
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
	it('readd component with new data', () => {
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
	it('addObserver two components with methods', () => {
		const comp1 = new Component();
		const comp2 = new Component();
		const obj = new Observable();
		const method1 = (val) => val;
		let method = method1;
		const method2 = (val) => `${val}xyz`;
		obj.addObserver(comp1, 'foo', { method }, 'bar');
		method = method2;
		obj.addObserver(comp2, 'abc', { method }, '');
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
	it('addObserver two components with methods, remove first', () => {
		const comp1 = new Component();
		const comp2 = new Component();
		const obj = new Observable();
		const method1 = (val) => val;
		let method = method1;
		const method2 = (val) => `${val}xyz`;
		obj.addObserver(comp1, 'foo', { method }, 'bar');
		method = method2;
		obj.addObserver(comp2, 'abc', { method }, '');
		obj.deleteObserver(comp1)
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
