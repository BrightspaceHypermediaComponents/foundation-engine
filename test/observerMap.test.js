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
			const proprety = 'proprety';
			const method = undefined;
			const value = 'href';

			observerMap.add(observer, proprety, method, value);

			expect(observerMap._observers.has(observer)).to.be.true;
			const getProprety = observerMap._observers.get(observer);
			expect(getProprety).to.be.equal(proprety);
		});

		it('should set value when adding a observer', async() => {
			const observer = {
				'bar': 'foo'
			};
			const proprety = 'proprety';
			const method = undefined;
			const value = 'href';

			observerMap.add(observer, proprety, method, value);

			expect(observerMap.value).to.be.equal(value);
			expect(observer[proprety]).to.be.equal(value);
		});

	});

	it('should delete a observer', async() => {
		const observer = {
			'bar': 'foo'
		};
		const proprety = 'proprety';
		const method = undefined;
		const value = 'href';

		observerMap.add(observer, proprety, method, value);
		observerMap.delete(observer);

		expect(observerMap._observers.has(observer)).to.be.false;
		expect(observer[proprety]).to.be.equal(value); //should this be removed
	});

	it('should update all object with new value', async() => {
		const observer = {
			'bar': 'foo'
		};
		const proprety = 'proprety';
		const method = undefined;
		const value = 'href';
		const newValue = 'newHref';

		observerMap.add(observer, proprety, method, value);
		observerMap.setProperty(newValue);

		expect(observer[proprety]).to.be.equal(newValue);
	});

});
