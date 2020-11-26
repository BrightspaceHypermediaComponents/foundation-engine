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

			assert(observerMap._observers.has(observer) === true);
			const getProperty = observerMap._observers.get(observer);
			assert(getProperty === property);
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

			assert(observerMap.value === value);
			assert(observer[property] === value);
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

		assert(observerMap._observers.has(observer) === false);
		assert(observer[property] === value); //should this be removed
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

		assert(observer[property] === newValue);
		assert(observer2[property] === newValue);
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

		assert(observer[property] === `${newValue}-changed`);
		assert(observer2[property] === `${newValue}-changed`);
	});

});
