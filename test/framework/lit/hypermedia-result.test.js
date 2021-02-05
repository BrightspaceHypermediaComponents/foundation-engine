import { customHypermediaElement, html } from '../../../framework/lit/hypermedia-components.js';
import { expect }  from '@open-wc/testing';
import { default as fetchMock } from 'fetch-mock/esm/client.js';
import { html as lithtml } from 'lit-element';

class TestComponent { }
class TestHMComponent { }
class TestHMComponentExtend { }
customElements.define('test-component', TestComponent);
customHypermediaElement('test-hm-component', TestHMComponent);
customHypermediaElement('test-hm-component-extend', TestHMComponentExtend, 'test-hm-component', [['class1']]);

describe('Lit-element Framework Integration', () => {

	it('outputs the same as lit html if element is not a Hypermedia element', () => {
		expect(html``).to.deep.equal(lithtml``);
		expect(html`<div></div>`).to.deep.equal(lithtml`<div></div>`);
		const value = 'foo';
		expect(html`<div thing="${value}"></div>`).to.deep.equal(lithtml`<div thing="${value}"></div>`);
		expect(html`<test-component></test-component>`).to.deep.equal(lithtml`<test-component></test-component>`);
		expect(html`<test-component value="${value}"></test-component>`).to.deep.equal(lithtml`<test-component value="${value}"></test-component>`);
	});

	describe('customHypermediaElement', () => {
		it('correctly adds the hm component tags to the component store', () => {
			const component = window.D2L.ComponentStore.get('test-hm-component');
			expect(component._elementPseudoTag).equals('test-hm-component');
			expect(component._componentStore.get('class1').get(null)).equals('test-hm-component-extend');
		});
	});

	describe('HypermediaResult', () => {
		it('creates a HypermediaResult from a component with an href and token', () => {
			const href = 'http://cupcake.ca';
			const token = 'cookie';
			const third = 'cake';
			const result = html`<test-component href="${href}" token="${token}" cup="${third}"></test-component>`;
			const litResult = lithtml`<test-component href="${href}" token="${token}" cup="${third}"></test-component>`;
			expect(result).to.deep.equal(litResult);
			expect(result.strings).to.deep.equal(['<test-component href="', '" token="', '" cup="', '"></test-component>']);
			expect(result.getHrefToken(result.strings, result.values)).to.deep.equal([href, token]);
		});

		it ('resolves to the skeleton with the regular TemplateResult attached as a value', () => {
			const href = 'http://d2l.com';
			const hypermediaResult = html`<test-hm-component href="${href}" token="foo"></test-hm-component>`;
			const litResult = lithtml`<test-hm-component skeleton></test-hm-component>`;
			expect(hypermediaResult.values[0], 'processed hm component resolves to the skeleton')
				.to.deep.equal(litResult);
		});

		it('resolves a tag that extends the base tag from the hypermedia classes', () => {
			const href = 'https://entity/';
			const token = 'foo';
			const entity = {
				class: ['class1']
			};
			const mock = fetchMock.mock(href, JSON.stringify(entity));
			const hypermediaResult = html`<test-hm-component href="${href}" .token="${token}"></test-hm-component>`;

			hypermediaResult._fetchedResults.then(result => {
				expect(mock.called(href)).to.be.true;
				expect(result.strings).to.deep.equal(['<test-hm-component-extend href="', '" .token="', '"></test-hm-component-extend>']);
				expect(result.values).to.deep.equal([href, token]);
				fetchMock.reset();
			});

		});
	});
});
