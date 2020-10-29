import { Fetchable, FetchError } from '../state/Fetchable.js';
import { expect }  from '@open-wc/testing';

class TestObject extends Fetchable(Object) {}

describe('FetchStatus', () => {
	let status;
	beforeEach(() => status = (new TestObject()).fetchStatus);

	it('starts and completes the status', () => {
		expect(status.complete).to.be.null;
		status.start();
		expect(typeof status.complete).to.be.equal('object');

		status.done();
		status.complete.then(result => expect(result).to.be.true);
	});

	it('starts and cancels the status', () => {
		expect(status.complete).to.be.null;
		status.start();
		expect(typeof status.complete).to.be.equal('object');

		status.cancel();
		status.complete.then(result => expect(result).to.be.null);
	});

	it('throws error if attempting to cancel or finish a non-started status', () => {
		expect(() => status.done()).to.throw(FetchError);
		expect(() => status.cancel()).to.throw(FetchError);
	});
});

describe('Fetchable', () => {

	let obj;
	beforeEach(() => obj = new TestObject('http://test.com', 'sometoken'));

	it('sets the href with query parameters', () => {
		expect(obj.href).to.be.equal('http://test.com');

		const paramObj = {
			'field1': 'value1',
			'field2': ['value2', 'value3']
		};
		const urlComma = encodeURIComponent(',');
		obj.setQueryParams(paramObj);
		expect(obj.href).to.be.equal(`http://test.com/?field1=value1&field2=value2${urlComma}value3`);
	});

	it('sets the href with new parameters when previously set', () => {
		obj.setQueryParams({ 'key': 'value' });
		expect(obj.href).to.be.equal('http://test.com/?key=value');
		obj.setQueryParams({ 'newKey': 'newValue' });
		expect(obj.href).to.be.equal('http://test.com/?newKey=newValue');
	});
});
