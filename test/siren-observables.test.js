import { assert, expect }  from '@open-wc/testing';
import { observableTypes as ot, sirenDefinedProperty, sirenObservableFactory } from '../state/observable/sirenObservableFactory.js';
import { HypermediaState } from '../state/HypermediaState.js';
import { SirenAction } from '../state/observable/SirenAction.js';
import { SirenClasses } from '../state/observable/SirenClasses.js';
import { SirenEntity } from '../state/observable/SirenEntity.js';
import { SirenLink } from '../state/observable/SirenLink.js';
import { SirenProperty } from '../state/observable/SirenProperty.js';
import { SirenSubEntities } from '../state/observable/SirenSubEntities.js';
import { SirenSubEntity } from '../state/observable/SirenSubEntity.js';

const orgHref = 'https://api.brightspace.com/rels/organization';

describe('observerFactory object creation', () => {
	it('ObservableFactory creates SirenAction', () => {
		const propertyInfo = {
			type: ot.action
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert.instanceOf(basicInfo, SirenAction, 'Object created was not a SirenAction');
	});

	it('ObservableFactory creates SirenClasses', () => {
		const propertyInfo = {
			type: ot.classes
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert.instanceOf(basicInfo, SirenClasses, 'Object created was not a SirenClasses');
	});

	it('ObservableFactory creates SirenProperty', () => {
		const propertyInfo = {
			type: ot.property
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert.instanceOf(basicInfo, SirenProperty, 'Object created was not a SirenProperty');
	});

	it('ObservableFactory creates SirenLink', () => {
		const propertyInfo = {
			type: ot.link
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert.instanceOf(basicInfo, SirenLink, 'Object created was not a SirenLink');
	});

	it('ObservableFactory creates SirenEntity', () => {
		const propertyInfo = {
			type: ot.entity
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert.instanceOf(basicInfo, SirenEntity, 'Object created was not a SirenEntity');
	});

	it('ObservableFactory creates SirenSubEntities', () => {
		const propertyInfo = {
			type: ot.subEntities
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert.instanceOf(basicInfo, SirenSubEntities, 'Object created was not a SirenSubEntities');
	});

	it('ObservableFactory creates SirenSubEntity', () => {
		const propertyInfo = {
			type: ot.subEntity
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert.instanceOf(basicInfo, SirenSubEntity, 'Object created was not a SirenSubEntity');
	});

	it('ObservableFactory fails to create class of type that does not exist', () => {
		const propertyInfo = { type: 8 };
		expect(() => { sirenObservableFactory(propertyInfo); }).to.throw('Bad siren component');
	});

	it('ObservableFactory fails to create class with object missing type', () => {
		const propertyInfo = {};
		expect(() => { sirenObservableFactory(propertyInfo); }).to.throw('Bad siren component');
	});
});

describe('creating sirenDefinedProperty incomplete objects', () => {

	it('property is not created from empty object', () => {
		const obj = {};
		const res = sirenDefinedProperty(obj, null);
		assert.isUndefined(res, 'properties created from empty object');
	});

	it('property is not created from object with useless fields', () => {
		const obj = { name: 'abc', token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert.isUndefined(res, 'properties created from object with no useful fields');
	});

	it('property with type is created from objects observable field', () => {
		const obj = { observable: ot.link, token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert.exists(res, 'object was not created from valid properties');
		assert.equal(res.type, ot.link, 'properties type is not set to observable');
		assert.isUndefined(res.token, 'properties token is set without prime and route existing');
		assert.isUndefined(res.route, 'properties route is defined without object route existing');
		assert.isUndefined(res.id, 'properties id is set with object rel existing');
	});

	it('property with type and id is created from object with observable and rel fields', () => {
		const obj = { rel: 'abcde', observable: ot.link, token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert.exists(res, 'object was not created from valid properties');
		assert.equal(res.type, ot.link, 'properties type is not set to observable');
		assert.isUndefined(res.token, 'properties token is set without prime and route existing');
		assert.isUndefined(res.route, 'properties route is defined without object route existing');
		assert.equal(res.id, 'abcde', 'property id is not set to object rel');
	});

	it('property is not created from object with empty route', () => {
		const obj = { route: [], token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert.isUndefined(res, 'property incorrectly created when empty route in object');
	});

	it('property is not created from object with one object with useless fields in route', () => {
		const obj = { route: [{ id: 987 }], token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert.isUndefined(res, 'property incorrectly created when route in object with useless object');
	});

	it('property has observable from route and token from obj', () => {
		const obj = { route: [{ observable: ot.link }], token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert.exists(res, 'property was not made from a valid object');

		assert.equal(res.type, ot.link, 'properties type is not set to observable');
		assert.isUndefined(res.id, 'properties id is set with object rel existing');
		assert.equal(res.token, 1234, 'property token was not set correctly');

		assert.exists(res.route, 'property has not route field');
		assert.deepEqual(res.route, { token: 1234, route: [] }, 'route property set incorrectly');
	});

	it('property has token and type from route', () => {
		const obj = { route: [{ observable: ot.link, token: 7489 }] };
		const res = sirenDefinedProperty(obj, null);

		assert.exists(res, 'property was not made from a valid object');

		assert.equal(res.type, ot.link, 'properties type is not set to observable');
		assert.isUndefined(res.id, 'properties id is set with object rel existing');
		assert.equal(res.token, 7489, 'property token was not set correctly');

		assert.exists(res.route, 'property has not route field');
		assert.deepEqual(res.route, { route: [] }, 'route property set incorrectly');
	});

	it('property has token from routes object, route uses objs token', () => {
		const obj = { route: [{ observable: ot.link, token: 7489 }], token: 1234 };
		const res = sirenDefinedProperty(obj, null);

		assert.exists(res, 'property was not made from a valid object');

		assert.equal(res.type, ot.link, 'properties type is not set to observable');
		assert.isUndefined(res.id, 'properties id is set with object rel existing');
		assert.equal(res.token, 7489, 'property token was not set correctly');

		assert.exists(res.route, 'property has not route field');
		assert.deepEqual(res.route, { token: 1234, route: [] }, 'route property set incorrectly');
	});

	it('property has token from first object in route. route contains second object from original route and token from obj', () => {
		const obj = { route: [{ observable: ot.link, token: 7489 }, { observable: ot.link, token: 42 }], token: 1234 };
		const res = sirenDefinedProperty(obj, null);

		assert.exists(res, 'property was not made from a valid object');

		assert.equal(res.type, ot.link, 'properties type is not set to observable');
		assert.isUndefined(res.id, 'properties id is set with object rel existing');
		assert.equal(res.token, 7489, 'property token was not set correctly');

		assert.exists(res.route, 'property has not route field');
		assert.deepEqual(res.route, { token: 1234, route: [{ observable: ot.link, token: 42 }] }, 'route property set incorrectly');
	});

	it('property created and contains token due to prime existing', () => {
		const obj = { prime: true, token: 1234, observable: ot.link };
		const res = sirenDefinedProperty(obj, null);

		assert.exists(res, 'property was not made from a valid object');

		assert.equal(res.type, ot.link, 'properties type is not set to observable');
		assert.isUndefined(res.id, 'properties id is set with object rel existing');
		assert.equal(res.token, 1234, 'property token was set incorrectly');
		assert.isUndefined(res.route, 'route property incorrectly set');
		assert.isUndefined(res.id, 'property id is set without rel field in object');
	});

	it('property created without token due to no token in obj', () => {
		const obj = { prime: true, observable: ot.link };
		const res = sirenDefinedProperty(obj, null);

		assert.exists(res, 'property was not made from a valid object');

		assert.equal(res.type, ot.link, 'properties type is not set to observable');
		assert.isUndefined(res.id, 'properties id is set with object rel existing');
		assert.isUndefined(res.token, 'property token was set without token in object');
		assert.isUndefined(res.route, 'route property incorrectly set');
		assert.isUndefined(res.id, 'property id is set without rel field in object');
	});

	it('property created without token due to prime being false', () => {
		const obj = { prime: false, token: 1234, observable: ot.link };
		const res = sirenDefinedProperty(obj, null);

		assert.exists(res, 'property was not made from a valid object');

		assert.equal(res.type, ot.link, 'properties type is not set to observable');
		assert.isUndefined(res.id, 'properties id is set with object rel existing');
		assert.isUndefined(res.token, 'property token was set when prime was false');
		assert.isUndefined(res.route, 'route property incorrectly set');
		assert.isUndefined(res.id, 'property id is set without rel field in object');
	});
});

describe('calling sirenDefinedProperty with observable objects', () => {

	it('property created for sirenLink', () => {
		const obj = { type: String, observable: ot.link, rel: orgHref };
		const res = sirenDefinedProperty(obj, null);

		assert.equal(res.type, ot.link, 'property link was set incorrectly');
		assert.equal(res.id, orgHref, 'property id is not objects rel');
		assert.isNull(res.state, 'property state set without a valid HypermediaState');
		assert.isUndefined(res.token, 'property token set without token in object');
	});

	it('property created for sirenLink with a HypermediaState', () => {
		const obj = { type: String, observable: ot.link, rel: orgHref };
		const state = new HypermediaState(orgHref, 21312);
		const res = sirenDefinedProperty(obj, state);

		assert.equal(res.type, ot.link, 'property link was set incorrectly');
		assert.equal(res.state, state, 'property state was not set to provided HypermediaState');
		assert.equal(res.id, orgHref, 'property id is not objects rel');
		assert.isUndefined(res.token, 'property token is not set to states token');
	});

	it('property created for sirenEntity. token does not exist', () => {
		const obj = { type: String, observable: ot.entity, rel: orgHref, token: 123123  };
		const res = sirenDefinedProperty(obj, null);

		assert.equal(res.type, ot.entity, 'property type set to wrong observable');
		assert.isNull(res.state, 'state was set when no HypermedidState provided');
		assert.equal(res.id, orgHref, 'property id is not objects rel');
		assert.isUndefined(res.token, 'property token should not be set in entity');
	});

	it('property created for sirenSubEntities where token exists', () => {
		const obj = { type: String, observable: ot.subEntities, rel: orgHref, token: 123123 };
		const res = sirenDefinedProperty(obj, null);

		assert.equal(res.type, ot.subEntities, 'property type set to wrong observable');
		assert.isNull(res.state, 'state was set when no HypermedidState provided');
		assert.equal(res.id, orgHref, 'property id is not objects rel');
		assert.equal(res.token, 123123, 'property token should be set in subEntities');
	});

	it('property created for sirenSubEntity. token does not exist', () => {
		const obj = { type: String, observable: ot.subEntity, rel: orgHref, token: 123123 };
		const res = sirenDefinedProperty(obj, null);

		assert.equal(res.type, ot.subEntity, 'property type set to wrong observable');
		assert.isNull(res.state, 'state was set when no HypermedidState provided');
		assert.equal(res.id, orgHref, 'property id is not objects rel');
		assert.isUndefined(res.token, 'property token should not be set in subEntity');
	});

	it('property created for sirenClasses. token does not exist', () => {
		const obj = { type: String, observable: ot.classes, rel: orgHref, token: 123123 };
		const res = sirenDefinedProperty(obj, null);

		assert.equal(res.type, ot.classes, 'property type set to wrong observable');
		assert.isNull(res.state, 'state was set when no HypermedidState provided');
		assert.equal(res.id, orgHref, 'property id is not objects rel');
		assert.isUndefined(res.token, 'property token should not be set in entity');
	});

	it('property created for sirenAction. token does not exist', () => {
		const obj = { type: String, observable: ot.action, rel: orgHref, token: 123123 };
		const res = sirenDefinedProperty(obj, null);

		assert.equal(res.type, ot.action, 'property type set to wrong observable');
		assert.isNull(res.state, 'state was set when no HypermedidState provided');
		assert.equal(res.id, orgHref, 'property id is not objects rel');
		assert.isUndefined(res.token, 'property token should not be set in entity');
	});

	it('property created for sirenProperty. id exists', () => {
		const obj = { type: String, observable: ot.property, token: 123123, name: '_hello' };
		const res = sirenDefinedProperty(obj, null);

		assert.equal(res.type, ot.property, 'property type set to wrong observable');
		assert.isNull(res.state, 'state was set when no HypermedidState provided');
		assert.equal(res.id, 'hello', 'property id is not objects name');
		assert.isUndefined(res.token, 'property token should not be set in entity');
	});
});
