import { assert }  from '@open-wc/testing';
import { ObserverMap } from '../state/observable/ObserverMap.js';

describe('ObserverMap', () => {

	let observerMap;

	beforeEach(() => {
		observerMap = new ObserverMap();
	});

	describe('should add an observer', () => {
		it('should add object by ref with key to be updated', async() => {
			const observer = {
				'bar': 'foo'
			};
			const property = 'property';
			const method = undefined;

			observerMap.add(observer, property, method);

			assert.isTrue(observerMap._observers.has(observer), 'Observer not add to map');
			const getProperty = observerMap._observers.get(observer);
			assert.equal(getProperty, property, 'Returned property does not match');
		});

		it('should set value when adding a observer', async() => {
			const observer = {
				'bar': 'foo'
			};
			const property = 'property';
			const method = undefined;
			const value = 'href';

			observerMap.setProperty(value);
			observerMap.add(observer, property, method);

			assert.equal(observerMap.value, value, 'Property was not set on observerMap');
			assert.equal(observer[property], value, 'Observer propert was not set');
		});

	});

	it('should delete a observer', async() => {
		const observer = {
			'bar': 'foo'
		};
		const property = 'property';
		const method = undefined;
		const value = 'href';

		observerMap.add(observer, property, method);
		observerMap.setProperty(value);
		observerMap.delete(observer);

		assert.isFalse(observerMap._observers.has(observer), 'Observer was not deleted');
		assert.equal(observer[property], value, 'Property no longer exists'); //should this be removed
	});

	it('should update all object with new value', async() => {
		const observer = {
			'bar': 'foo'
		};
		const observer2 = {
			'bar': 'foo'
		};

		const property = 'property';
		const method = undefined;
		const newValue = 'newHref';

		observerMap.add(observer, property, method);
		observerMap.add(observer2, property, method);
		observerMap.setProperty(newValue);

		assert.equal(observer[property], newValue, 'Observer property was not updated');
		assert.equal(observer2[property], newValue, 'Observer2 property was not updated');
	});

	it('should update all objects with value from method', async() => {
		const observer = {
			'bar': 'foo'
		};
		const observer2 = {
			'bar': 'foo'
		};

		const property = 'property';
		const method = (value) => { return `${value}-changed`; };
		const newValue = 'newHref';

		observerMap.add(observer, property, method);
		observerMap.add(observer2, property, method);
		observerMap.setProperty(newValue);

		assert.equal(observer[property], `${newValue}-changed`, 'Observer property was not updated using the method');
		assert.equal(observer2[property], `${newValue}-changed`, 'Observer2 property was not updated using the method');
	});

});
