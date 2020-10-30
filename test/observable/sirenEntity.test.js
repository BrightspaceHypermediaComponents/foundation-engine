import { assert }  from '@open-wc/testing';
import { Component } from '../../state/observable/Common.js';
import { SirenEntity } from '../../state/observable/SirenEntity.js';

describe('sirenEntity methods', () => {
	it('constructor called', () => {
		const obj = new SirenEntity();
		assert.isUndefined(obj.sirenEntity, 'sirenEntity should be unset');
	});

	it('objects entity is set', () => {
		const obj = new SirenEntity();
		obj.sirenEntity = 'abc';
		assert.equal(obj.sirenEntity, 'abc', 'sirenEnity field was not set through method');
		assert.equal(obj._observers._components.size, 0, 'sirenEntity should have no observers');
	});

	it('observerMap is added to sirenEntity', () => {
		const obj = new SirenEntity();
		const comp = new Component();
		const method = (val) => val;

		obj.addObserver(comp, 'foo', { method });

		const map = obj._observers.components;
		assert.equal(map.size, 1, 'entity has one observer');
		assert.equal(map.get(comp), 'foo', 'observer is not mapped to value');

		const methods = obj._observers._methods;
		assert.isTrue(methods.has(comp), 'method is not recorded for observer');
		assert.equal(methods.get(comp), method, 'observer maps to incorrect method');
		assert.isUndefined(comp['foo'], 'observer should not map to a defined value');
	});
});

describe('sirenEntity setting values and adding observers', () => {

	it('sirenEntity is undefined after setting sirenEntity to undefiend', () => {
		const obj = new SirenEntity();
		obj.sirenEntity = 'foo';
		obj.setSirenEntity(undefined);
		assert.isUndefined(obj.sirenEntity, 'resetting entity to undefined failed');
	});

	it('sirenEntity is reset when setSiren is used', () => {
		const obj = new SirenEntity();
		const entity = 'bar';

		obj.sirenEntity = 'foo';
		obj.setSirenEntity(entity);

		assert.equal(obj.sirenEntity, 'bar', 'setting entity to new value failed');
	});

	it('observer maps to value of sirenEntity set before observer was added', () => {
		const obj = new SirenEntity();
		const comp = new Component();
		const method = (val) => val;

		obj.sirenEntity = 'bar';
		obj.addObserver(comp, 'foo', { method });

		assert.equal(comp['foo'], 'bar', 'entity value was not set to the observer');
	});
});
