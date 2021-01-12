import { expect } from '@open-wc/testing';
import { SirenAction } from '../../state/observable/SirenAction.js';

describe('SirenAction', () => {
	describe('setBodyFromInput', () => {
		let action;
		beforeEach(() => action = new SirenAction({ id: 'example-action', token: 'foo' }));

		it('sets the body for json requests', () => {
			action._fields = { 'someField': 'someValue' };
			action._rawSirenAction = { type: ['json'], method: 'POST' };
			action.setBodyFromInput({ 'anotherField': 'anotherValue' });
			expect(action._body, 'body is a string').to.be.a('string');
			expect(JSON.parse(action._body), 'body equals the json').to.deep.equal({
				'anotherField': 'anotherValue', 'someField': 'someValue'
			});
		});

		it('does not set the body for GET and HEAD requests', () => {
			action._fields = { 'someField': 'someValue' };
			action._rawSirenAction = { type: [], method: 'GET' };
			action.setBodyFromInput({ 'anotherField': 'anotherValue' });
			expect(action._body).to.be.null;

			action._rawSirenAction = { type: [], method: 'HEAD' };
			action.setBodyFromInput({ 'anotherField': 'anotherValue' });
			expect(action._body).to.be.null;
		});

		it('sets the body from a given input', () => {
			action._fields = { 'someField': 'someValue' };
			action._rawSirenAction = { type: [], method: 'POST' };
			action.setBodyFromInput({ 'anotherField': 'anotherValue' });
			expect(action._body, 'body is a FormData object').to.be.a('formdata');
			expect(action._body.has('someField'), 'body has the old field').to.be.true;
			expect(action._body.has('anotherField'), 'body has the new field').to.be.true;
		});

		it('sets the body from an input with an array value', () => {
			action._rawSirenAction = { type: [], method: 'POST' };
			action.setBodyFromInput({ 'arrayField': [1, 2, 3] });
			expect(action._body, 'body is a FormData object').to.be.a('formdata');
			expect(action._body.has('arrayField'), 'body has the new field').to.be.true;
			expect(action._body.getAll('arrayField'), 'field has all of the values').to.deep.equal([
				'1', '2', '3'
			]);
		});
	});
});
