import { expect }  from '@open-wc/testing';
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
			const value = 'href';

			observerMap.add(observer, property, method, value);

			expect(observerMap._observers.has(observer)).to.be.true;
			const getProperty = observerMap._observers.get(observer);
			expect(getProperty).to.be.equal(property);
		});

		it('should set value when adding a observer', async() => {
			const observer = {
				'bar': 'foo'
			};
			const property = 'property';
			const method = undefined;
			const value = 'href';

			observerMap.add(observer, property, method);
			observerMap.setProperty(value);

			expect(observerMap.value).to.be.equal(value);
			expect(observer[property]).to.be.equal(value);
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

		expect(observerMap._observers.has(observer)).to.be.false;
		expect(observer[property]).to.be.equal(value); //should this be removed
	});

	it('should update all object with new value', async() => {
		const observer = {
			'bar': 'foo'
		};
		const property = 'property';
		const method = undefined;
		const value = 'href';
		const newValue = 'newHref';

		observerMap.add(observer, property, method, value);
		observerMap.setProperty(newValue);

		expect(observer[property]).to.be.equal(newValue);
	});

});
