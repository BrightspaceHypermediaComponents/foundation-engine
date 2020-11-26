import { expect }  from '@open-wc/testing';
import { Fetchable } from '../state/Fetchable.js';

class FetchableObject extends Fetchable(Object) {}

describe('Fetch', () => {
	let fetchableInstance;
	beforeEach(() => {
		fetchableInstance = new FetchableObject('testHref', 'token');
	});

	it('starts and completes the status', () => {
		expect(fetchableInstance.href).to.equal('testHref');
	});
});
