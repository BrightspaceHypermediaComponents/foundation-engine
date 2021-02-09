import './summon-action-components.js';
import './subentities-components.js';
import './action-components.js';
import { expect, fixture, waitUntil } from '@open-wc/testing';
import { clearStore } from '../../state/HypermediaState.js';
import { default as fetchMock } from 'fetch-mock/esm/client.js';
import { html } from 'lit-html';

describe('Component integration', () => {
	describe('Actions', () => {
		afterEach(() => fetchMock.reset());

		it('creates an action from the entity', async() => {
			const selfHref = 'https://entity';
			const actionHref = 'https://action/do';
			const entity = {
				actions: [{ href: actionHref, method: 'POST', name: 'example-action' }],
				links: [{ rel: ['self'], href: selfHref }]
			};
			const mock = fetchMock.mock(selfHref, JSON.stringify(entity));

			const element = await fixture(html`<action-component href="${selfHref}" token="foo"></action-component>`);
			await waitUntil(() => element._state.fetchStatus.pending);
			expect(element._hasAction('exampleAction')).to.be.false;
			expect(mock.called(selfHref)).to.be.true;
			await waitUntil(() => element._loaded === true);
			expect(element._hasAction('exampleAction')).to.be.true;
		});
	});
	describe('Summon Actions', () => {
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

			await waitUntil(() => element._loaded === true);
			expect(mock.called(selfHref)).to.be.true;
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
				.mock(selfHref, JSON.stringify(entity))
				.mock(actionHref, JSON.stringify(summonedEntity));
			const element = await fixture(html`
				<summon-action-routed-action-component href="${selfHref}" token="foo"></summon-action-routed-action-component>
			`);

			expect(element._hasAction('exampleAction'), 'does not have the action yet').to.be.undefined;
			await waitUntil(() => element._loaded === true);
			expect(mock.called(actionHref)).to.be.true;
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
				.mock(selfHref, JSON.stringify(entity))
				.mock(actionHref, JSON.stringify(summonedEntity));
			const element = await fixture(html`
				<summon-action-routed-summon-action-component href="${selfHref}" token="foo"></summon-action-routed-summon-action-component>
			`);
			expect(element._hasAction('nestedSummon'), 'does not have the action yet').to.be.undefined;
			await waitUntil(() => element._loaded === true);
			expect(mock.called(selfHref)).to.be.true;
			expect(mock.called(actionHref)).to.be.true;
			expect(element._hasAction('nestedSummon'), 'has the action').to.be.true;
		});
	});

	describe('SubEntities', () => {
		afterEach(() => {
			fetchMock.reset();
			clearStore();
		});

		it('gets the subEntities', async() => {
			const selfHref = 'https://entity';
			const entity = {
				entities: [{
					properties: { prop1: 'foo', prop2: 'bar' },
					rel: ['item']
				}],
				links: [{ rel: ['self'], href: selfHref }]
			};
			const mock = fetchMock.mock(selfHref, JSON.stringify(entity));
			const element = await fixture(html`<subentities-component href="${selfHref}" token="someToken"></subentities-component>`);
			await waitUntil(() => element._loaded === true);
			expect(mock.called(selfHref)).to.be.true;
			expect(element.items).to.exist;
			expect(element.items).to.be.an('array');
			expect(element.items).to.have.lengthOf(1);
			expect(element.items[0].properties.prop1).to.be.equal('foo');
		});

		it('gets the routed subEntities', async() => {
			const selfHref = 'https://entity';
			const linkedHref = 'https://entity/linked';
			const entity = {
				links: [{ rel: ['self'], href: selfHref }, { rel: ['linked'], href: linkedHref }]
			};
			const linkedEntity = {
				entities: [{
					properties: { prop1: 'foo', prop2: 'bar' },
					rel: ['item']
				}]
			};
			const mock = fetchMock
				.mock(selfHref, JSON.stringify(entity))
				.mock(linkedHref, JSON.stringify(linkedEntity), { delay: 500 });
			const element = await fixture(html`<routed-subentities-component href="${selfHref}" token="someToken"></routed-subentities-component>`);
			await waitUntil(() => element._loaded === true);
			expect(mock.called(selfHref)).to.be.true;
			expect(mock.called(linkedHref)).to.be.true;
			expect(element.items).to.exist;
			expect(element.items).to.be.an('array');
			expect(element.items).to.have.lengthOf(1);
			expect(element.items[0].properties.prop1).to.be.equal('foo');
		});

		it('updates the state from the component', async() => {
			const entityHref = 'https://entity';
			const routedHref = 'https://entity-routed';
			const entity = {
				entities: [{
					properties: { prop1: 'foo', prop2: 'bar' },
					rel: ['item']
				}],
				links: [{ rel: ['self'], href: entityHref }]
			};
			const entityWithRouting = {
				links: [{ rel: ['self'], href: routedHref }, { rel: ['linked'], href: entityHref }]
			};
			const mock = fetchMock
				.mock(entityHref, JSON.stringify(entity))
				.mock(routedHref, JSON.stringify(entityWithRouting));
			const element = await fixture(html`<subentities-component href="${entityHref}" token="someToken"></subentities-component>`);
			const elementWithRouting = await fixture(html`<routed-subentities-component href="${routedHref}" token="someToken"></routed-subentities-component>`);
			await waitUntil(() => element._loaded === true);
			expect(mock.called(entityHref)).to.be.true;
			expect(mock.called(routedHref)).to.be.true;

			expect(element.items).to.exist;
			expect(element.items).to.be.an('array');
			expect(element.items).to.have.lengthOf(1);
			expect(elementWithRouting.items).to.exist;
			expect(elementWithRouting.items).to.be.an('array');
			expect(elementWithRouting.items).to.have.lengthOf(1);

			// update the state from the first component
			element.updateItems([{
				properties: { newProp: 'cake' }
			}]);
			expect(element.items[0].properties.newProp).to.be.equal('cake');
			expect(elementWithRouting.items[0].properties.newProp, 'second observing component sees change').to.be.equal('cake');
			// update the state from the second component
			elementWithRouting.updateItems([{
				properties: { newProp: 'cupcake' }
			}]);
			expect(elementWithRouting.items[0].properties.newProp, 'routed component sees change').to.be.equal('cupcake');
			expect(element.items[0].properties.newProp, 'component directly observing sees change').to.be.equal('cupcake');

		});
		describe('loading multiple subentities listening to the same state', () => {
			const numberOfComponents = 5;
			const numberOfItems = 5;
			let elements, mock;
			const selfHref = 'https://entity';

			beforeEach(async() => {
				const subEntities = [];
				for (let i = 0; i < numberOfItems; i++) {
					subEntities.push({
						properties: { itemNumber: i },
						rel: ['item']
					});
				}
				const entity = {
					entities: subEntities,
					links: [{ rel: ['self'], href: selfHref }]
				};
				mock = fetchMock.mock(selfHref, JSON.stringify(entity));
				elements = [];
				for (let i = 0; i < numberOfComponents; i++) {
					elements.push(await fixture(html`<subentities-component-modified-list href="${selfHref}" token="someToken"></subentities-component-modified-list>`));
				}
				await waitUntil(() => elements[0]._loaded === true);
			});

			afterEach(() => {
				mock.resetHistory();
				clearStore();
			});

			it('will load multiple components listening to the same subEntities', async() => {
				elements.forEach(element => {
					expect(mock.called(selfHref)).to.be.true;
					expect(element.items).to.exist;
					expect(element.items).to.be.an('array');
					expect(element.items).to.have.lengthOf(numberOfItems);
					let uniqueId = null;
					element.items.forEach((item, key) => {
						uniqueId = uniqueId === null ? item.properties.itemNumber : uniqueId;
						expect(item.properties.itemNumber).to.be.equal(key + uniqueId);
					});
				});
			});

			it('will change all instances when one updates the state', async() => {
				const newItems = ['one', 'two', 'three'];
				await elements[0].updateItems(newItems);

				elements.forEach(element => {
					expect(element.items).to.deep.equal(newItems);
				});
			});
		});
	});
});
