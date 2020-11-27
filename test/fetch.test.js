import { expect }  from '@open-wc/testing';
import { Fetchable } from '../state/Fetchable.js';

class FetchableObject extends Fetchable(Object) {}

describe('Fetch', () => {
	let fetchableInstance;
	//let sandbox;

	beforeEach(() => {
		/*
		sandbox = sinon.sandbox.create();

		sandbox.stub(window.d2lfetch, 'fetch').callsFake(() => {

			return Promise.resolve({
				ok: false,
				status: 404
			}
			);
		});
		*/
		fetchableInstance = new FetchableObject('testHref', 'token');
	});
	/*
	afterEach(() => {
		sandbox.restore();
	});
	*/
	it('starts and completes the status', () => {
		expect(fetchableInstance.href).to.equal('testHref');
	});
});
