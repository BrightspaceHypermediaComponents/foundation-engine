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
		// the first API call will attach the summon action to the component
		// the system should see the route parameter and automatically call summon
		// then we wait until that response is received
		// expect that this will fail until routing is added
		// todo: remove these comments and this try catch block when test passes
		try {
			await waitUntil(() => mock.called(actionHref));
		} catch (e) {
			throw new Error(`summon was never called on the action or timed out.\n\t${e.message}`);
		}
		// now we expect the system attaches the routed action to the component
		await aTimeout(200); //Maya can too, so can Ten
		expect(element._hasAction('exampleAction'), 'has the action').to.be.true;
	});
});
