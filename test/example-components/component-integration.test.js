import './summon-action-component.js';
import { expect, fixture, waitUntil } from '@open-wc/testing';
import { default as fetchMock } from 'fetch-mock/esm/client.js';
import { html } from 'lit-html';

describe('Component integration', () => {
	it('receives an entity when we summon one', async() => {
		const selfHref = 'https://summon-action/entity';
		const actionHref = 'https://summon-action/do';
		const entity = {
			actions: [{ href: actionHref, method: 'POST', name: 'example-summon' }],
			links: [{ rel: ['self'], href: selfHref }]
		};
		const summonedEntity = {
			properties: [{ someProperty: 'foobar' }]
		};
		const mock = fetchMock
			.mock(selfHref, JSON.stringify(entity))
			.post(actionHref, JSON.stringify(summonedEntity));
		const element = await fixture(html`<summon-action-component href="${selfHref}" token="foo"></summon-action-component>`);

		await waitUntil(() => mock.called(selfHref));
		expect(element.summonedEntity).to.be.undefined;
		expect(element._hasAction('exampleSummon')).to.be.true;
		await element.getSummonedThing();
		expect(element.summonedEntity).to.exist;
		expect(element.summonedEntity.properties).to.deep.equal(summonedEntity.properties);
	});
});
