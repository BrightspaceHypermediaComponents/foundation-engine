import { expect } from '@open-wc/testing';
import { SirenFacade } from '../../state/observable/SirenFacade.js';
import { default as SirenParse } from 'siren-parser';

describe('SirenFacade', () => {
	it('constructs with no arguments', () => {
		const facade = new SirenFacade();
		expect(facade).to.be.empty;
	});

	it('constructs with empty object', () => {
		const facade = new SirenFacade({});
		expect(facade.href).to.be.undefined;
		expect(facade.class).to.be.empty;
		expect(facade.entities).to.be.empty;
		expect(facade.links).to.be.empty;
		expect(facade.properties).to.be.empty;
		expect(facade.rawSirenParsedEntity).to.be.undefined;
		expect(facade.actions).to.be.empty;
	});

	describe('SirenParser integration', () => {
		it('creates a facade from an object with no self link', async() => {
			const entity = await SirenParse({
				'links': [{ 'rel':['some-rel'], 'href': 'RandomLink' }]
			});
			const facade = new SirenFacade(entity);
			expect(facade.href).to.be.undefined;
			expect(facade.links).to.have.lengthOf(1);
		});

		it('creates a facade from an object with a self link', async() => {
			const entity = await SirenParse({
				'links': [{ 'rel':['self'], 'href': 'selfLink' }]
			});
			const facade = new SirenFacade(entity);
			expect(facade.href).to.be.equal('selfLink');
			expect(facade.links).to.have.lengthOf(1);
		});

		it('has classes on the facade that can be accessed with hasClass', async() => {
			const entity = await SirenParse({
				'class': ['class-one', 'class-two']
			});
			const facade = new SirenFacade(entity);
			expect(facade.class).to.be.lengthOf(2);
			expect(facade.hasClass('class-one')).to.be.true;
			expect(facade.hasClass('class-two')).to.be.true;
			expect(facade.hasClass('non-existent')).to.be.false;
		});

		it('has a properties object even when there are no properties', async() => {
			const entity = await SirenParse({});
			const facade = new SirenFacade(entity);
			expect(facade.properties).to.not.be.undefined;
			expect(facade.properties.someProperty).to.be.undefined;
		});

		it('has properties set correctly when they exist', async() => {
			const entity = await SirenParse({
				'properties': { 'name': 'leeroy', 'answer-to-life': 'not 2020' }
			});
			const facade = new SirenFacade(entity);
			expect(facade.properties.name).to.equal('leeroy');
			expect(facade.properties['answer-to-life']).to.equal('not 2020');
		});

		it('has sub-entities that are also SirenFacades', async() => {
			const entity = await SirenParse({
				'entities': [
					{ 'rel': ['item'] },
					{ 'rel': ['item'] },
					{ 'rel': ['with-self-link'], 'links': [{ 'rel': ['self'], 'href': 'selfLink' }] }
				]
			});
			const facade = new SirenFacade(entity);
			expect(facade.entities).to.have.lengthOf(3);
			expect(facade.entities[0]).to.be.instanceof(SirenFacade);
			expect(facade.entities[2].href).to.be.equal('selfLink');
		});

		it('has actions that are just the names', async() => {
			const entity = await SirenParse({
				'actions': [
					{ 'href': 'http://action-one', 'name': 'action-one', 'method': 'GET' },
					{ 'href': 'http://action-two', 'name': 'action-with-fields', 'method': 'PATCH', 'fields': [
						{ 'type': 'text', 'name': 'aTextField' }, { 'type': 'text', 'name': 'anotherField' }
					] }
				]
			});
			const facade = new SirenFacade(entity);
			expect(facade.actions).to.have.lengthOf(2);
			expect(facade.actions[1].fields).to.be.undefined;
			expect(facade.actions[0]).to.equal('action-one');
			expect(facade.actions[1]).to.equal('action-with-fields');
		});

		it('does not give the raw version without verbose mode', async() => {
			const entity = await SirenParse({
				'links': [{ 'rel': ['self'], 'href': 'selfLink' }]
			});
			const facade = new SirenFacade(entity);
			expect(facade.rawSirenParsedEntity).to.be.undefined;
		});

		it('has the raw entity in verbose mode', async() => {
			const entity = await SirenParse({
				'links': [{ 'rel': ['linkedThing'], 'href': 'http://linked-thing' }]
			});
			const facade = new SirenFacade(entity, true);
			expect(facade.rawSirenParsedEntity).to.exist;
			expect(facade.rawSirenParsedEntity._linksByRel.linkedThing).to.be.lengthOf(1);
		});

		it('has verbose sub-entity', async() => {
			const entity = await SirenParse({
				'entities': [
					{ 'rel': ['item'], 'links': [{ 'rel': ['linkedThing'], 'href': 'http://linked-thing' }] }
				]
			});
			const facade = new SirenFacade(entity, true);
			expect(facade.entities).to.have.lengthOf(1);
			expect(facade.entities[0].rawSirenParsedEntity).to.exist;
			expect(facade.entities[0].rawSirenParsedEntity._linksByRel.linkedThing).to.be.lengthOf(1);
		});
	});
});
