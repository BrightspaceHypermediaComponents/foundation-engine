import './summon-action-components.js';
import { expect, fixture, waitUntil } from '@open-wc/testing';
import { default as fetchMock } from 'fetch-mock/esm/client.js';
import { html } from 'lit-html';

describe('Component integration', () => {
	let selfHref, actionHref;
	beforeEach(() => {
		selfHref = 'https://summon-action/entity';
		actionHref = 'https://summon-action/do';
	});

	it('receives an entity when we summon one', async() => {
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
		const entity = {
			actions: [{ href: actionHref, method: 'POST', name: 'example-summon' }],
			links: [{ rel: ['self'], href: selfHref }]
		};
		const summonedActionHref = 'https://summoned-action/';
		const summonedEntity = {
			actions: [{ href: summonedActionHref, name: 'example-action', method: 'PUT' }]
		};
		const mock = fetchMock
			.mock(selfHref, JSON.stringify(entity))
			.post(actionHref, JSON.stringify(summonedEntity));
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
		expect(element._hasAction('exampleAction'), 'has the action').to.be.true;
	});
});
