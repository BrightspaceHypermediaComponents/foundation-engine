import './summon-action-components.js';
import { aTimeout, expect, fixture, waitUntil } from '@open-wc/testing';
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
			.mock(selfHref, JSON.stringify(entity), {
				delay: 50, // fake a slow network
			})
			.post(actionHref, JSON.stringify(summonedEntity), {
				delay: 100, // fake a slow network
			});
		const element = await fixture(html`<summon-action-component href="${selfHref}" token="foo"></summon-action-component>`);

		await waitUntil(() => mock.called(selfHref));

		await aTimeout(300);
		expect(element.summonedEntity).to.be.undefined;
		expect(element._hasAction('exampleSummon')).to.be.true;
		await element.getSummonedThing();
		expect(element.summonedEntity).to.exist;
		expect(element.summonedEntity.properties).to.deep.equal(summonedEntity.properties);
	});

	it('gets an action routed through a summon action', async() => {
		const selfHref = 'https://summon-action/entity-2';
		const actionHref = 'https://summon-action/do-2';
		const entity = {
			actions: [{ href: actionHref, method: 'POST', name: 'example-summon' }],
			links: [{ rel: ['self'], href: selfHref }]
		};
		const summonedActionHref = 'https://summoned-action/';
		const summonedEntity = {
			actions: [{ href: summonedActionHref, name: 'example-action', method: 'PUT' }]
		};
		const mock = fetchMock
			.mock(selfHref, JSON.stringify(entity), {
				delay: 100, // fake a slow network
			})
			.mock(actionHref, JSON.stringify(summonedEntity), {
				delay: 100, // fake a slow network
			});
		const element = await fixture(html`
			<summon-action-routed-action-component href="${selfHref}" token="foo"></summon-action-routed-action-component>
		`);

		await waitUntil(() => mock.called(selfHref));

		expect(element._hasAction('exampleAction'), 'does not have the action yet').to.be.undefined;

		await waitUntil(() => mock.called(actionHref));

		await aTimeout(400);
		expect(element._hasAction('exampleAction'), 'has the action').to.be.true;
	});

	it('gets an summon action routed through a summon action', async() => {
		const selfHref = 'https://summon-action/entity-3';
		const actionHref = 'https://summon-action/do-3';
		const entity = {
			actions: [{ href: actionHref, method: 'POST', name: 'example-summon' }],
			links: [{ rel: ['self'], href: selfHref }]
		};
		const summonedActionHref = 'https://summoned-action/nested-summon';
		const summonedEntity = {
			actions: [{ href: summonedActionHref, name: 'example-nested-summon', method: 'POST' }]
		};
		const mock = fetchMock
			.mock(selfHref, JSON.stringify(entity), {
				delay: 100, // fake a slow network
			})
			.mock(actionHref, JSON.stringify(summonedEntity), {
				delay: 100, // fake a slow network
			});
		const element = await fixture(html`
			<summon-action-routed-summon-action-component href="${selfHref}" token="foo"></summon-action-routed-summon-action-component>
		`);

		await waitUntil(() => mock.called(selfHref));

		expect(element._hasAction('nestedSummon'), 'does not have the action yet').to.be.undefined;

		await waitUntil(() => mock.called(actionHref));

		await aTimeout(400);
		expect(element._hasAction('nestedSummon'), 'has the action').to.be.true;
	});
});
