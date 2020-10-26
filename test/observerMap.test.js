import { expect }  from '@open-wc/testing';
import { ObserverMap } from '../state/observable/ObserverMap.js';

describe('ObserverMap', () => {

	let observerMap;

	beforeEach(() => {
		observerMap = new ObserverMap();
	});

	describe('should add an observer', () => {
		it('should add object by ref with key to be updated', async() => {
			const component = {
				'bar': 'foo'
			};
			const proprety = 'proprety';
			const method = undefined;
			const value = 'href';

			observerMap.add(component, proprety, method, value);

			expect(observerMap._observers.has(component)).to.be.true;
			const getProprety = observerMap._observers.get(component);
			expect(getProprety).to.be.equal(proprety);
		});

		it('should set value when adding a component', async() => {
			const component = {
				'bar': 'foo'
			};
			const proprety = 'proprety';
			const method = undefined;
			const value = 'href';

			observerMap.add(component, proprety, method, value);

			expect(observerMap.value).to.be.equal(value);
			expect(component[proprety]).to.be.equal(value);
		});

	});

	it('should delete a component', async() => {
		const component = {
			'bar': 'foo'
		};
		const proprety = 'proprety';
		const method = undefined;
		const value = 'href';

		observerMap.add(component, proprety, method, value);
		observerMap.delete(component);

		expect(observerMap._observers.has(component)).to.be.false;
		expect(component[proprety]).to.be.equal(value); //should this be removed
	});

	it('should update all object with new value', async() => {
		const component = {
			'bar': 'foo'
		};
		const proprety = 'proprety';
		const method = undefined;
		const value = 'href';
		const newValue = 'newHref';

		observerMap.add(component, proprety, method, value);
		observerMap.setProperty(newValue);

		expect(component[proprety]).to.be.equal(newValue);
	});

});
