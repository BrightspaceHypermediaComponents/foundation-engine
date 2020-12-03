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

	describe('should merge observers', () => {
		let observerMap2;
		beforeEach(() => {
			observerMap2 = new ObserverMap();
		});

		it('should merge two observers, only the one merged to is altered', () => {
			const observer1 = {
				'bar': 'foo'
			};
			const observer2 = {
				'abc': 'efg'
			};
			const property = 'property';
			const value1 = 'hello';
			const value2 = 'goodbye';

			observerMap.add(observer1, property);
			observerMap.setProperty(value1);

			observerMap2.add(observer2, property);
			observerMap2.setProperty(value2);

			observerMap.merge(observerMap2);

			assert.equal(observerMap._observers.size, 2, 'should have two observers after merge');
			assert.equal(observerMap._observers.get(observer1), property, 'should have original observer unmodified');
			assert.equal(observerMap._observers.get(observer2), property, 'should have merged observer added');
			assert.equal(observer1[property], value1, 'first observer should map to original property');
			assert.equal(observer2[property], value1, 'second observer should map to new property');

			assert.equal(observerMap2._observers.size, 1, 'observerMap2 should be unaltered after merge');
		});

		it('should be unaltered after merging map with same entry', () => {
			const observer1 = {
				'bar': 'foo'
			};

			const property = 'property';
			const value1 = 'hello';

			observerMap.add(observer1, property);
			observerMap.setProperty(value1);

			observerMap2.add(observer1, property);

			observerMap.merge(observerMap2);

			assert.equal(observerMap._observers.size, 1, 'should have two observers after merge');
			assert.equal(observerMap._observers.get(observer1), property, 'should have original observer unmodified');
			assert.equal(observer1[property], value1, 'first observer should map to original property');

			assert.equal(observerMap2._observers.size, 1, 'observerMap2 should be unaltered after merge');
		});

		it('should merge two large observerMaps', () => {
			const observer1 = {
				'bar': 'foo'
			};
			const observer2 = {
				'abc': '123'
			};
			const observer3 = {
				'xyz': '789'
			};
			const observer4 = {
				'name': 'foo'
			};

			const property = 'property';
			const link = 'link';
			const value1 = 'hello';
			const value2 = 'goodbye';

			observerMap.add(observer1, property);
			observerMap.add(observer2, link);
			observerMap.setProperty(value1);

			observerMap2.add(observer3, property);
			observerMap2.add(observer4, link);
			observerMap2.setProperty(value2);

			observerMap.merge(observerMap2);

			assert.equal(observerMap._observers.size, 4, 'should have two observers after merge');
			assert.equal(observerMap._observers.get(observer1), property, 'observer1 should be property');
			assert.equal(observerMap._observers.get(observer2), link, 'observer2 should be link');
			assert.equal(observerMap._observers.get(observer3), property, 'observer3 should be property');
			assert.equal(observerMap._observers.get(observer4), link, 'observer4 should be link');
			assert.equal(observer1[property], value1, 'observer1 should map to original property');
			assert.equal(observer2[link], value1, 'observer2 should map to original property');
			assert.equal(observer3[property], value1, 'observer3 should map to updated');
			assert.equal(observer4[link], value1, 'observer1 should map to updated property');

			assert.equal(observerMap2._observers.size, 2, 'observerMap2 should be unaltered after merge');
		});

		it('should merge two observers and apply method', () => {
			const observer1 = {
				'bar': 'foo'
			};
			const observer2 = {
				'abc': 'efg'
			};
			const property = 'property';
			const value1 = 'hello';
			const value2 = 'goodbye';
			const method = (val) => `${val}${val}`;
			assert.isFunction(method);

			observerMap.add(observer1, property);
			observerMap.setProperty(value1);

			observerMap2.add(observer2, property, method);
			observerMap2.setProperty(value2);

			observerMap.merge(observerMap2);

			assert.equal(observerMap._observers.size, 2, 'should have two observers after merge');
			assert.equal(observerMap._observers.get(observer1), property, 'should have original observer unmodified');
			assert.equal(observerMap._observers.get(observer2), property, 'should have merged observer added');
			assert.equal(observer1[property], value1, 'first observer should map to original property');
			assert.equal(observer2[property], `${value1}${value1}`, 'second observer should map to new mapped property');

			assert.equal(observerMap2._observers.size, 1, 'observerMap2 should be unaltered after merge');
		});
	});
});
