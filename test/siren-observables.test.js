import { observableTypes as ot, sirenDefinedProperty, sirenObservableFactory } from '../state/observable/sirenObservablesFactory.js';
import { assert }  from '@open-wc/testing';
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
		assert(basicInfo instanceof SirenAction);
	});

	it('ObservableFactory creates SirenClasses', () => {
		const propertyInfo = {
			type: ot.classes
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenClasses);
	});

	it('ObservableFactory creates SirenProperty', () => {
		const propertyInfo = {
			type: ot.property
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenProperty);
	});

	it('ObservableFactory creates SirenLink', () => {
		const propertyInfo = {
			type: ot.link
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenLink);
	});

	it('ObservableFactory creates SirenEntity', () => {
		const propertyInfo = {
			type: ot.entity
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenEntity);
	});

	it('ObservableFactory creates SirenSubEntities', () => {
		const propertyInfo = {
			type: ot.subEntities
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenSubEntities);
	});

	it('ObservableFactory creates SirenSubEntity', () => {
		const propertyInfo = {
			type: ot.subEntity
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenSubEntity);
	});

	it('ObservableFactory fails to create class of type that does not exist', () => {
		const propertyInfo = {
			type: 8
		};
		try {
			sirenObservableFactory(propertyInfo);
		} catch (err) {
			assert(err.message === 'Bad siren component');
		}
	});

	it('ObservableFactory fails to create class with object missing type', () => {
		const propertyInfo = {};
		try {
			sirenObservableFactory(propertyInfo);
		} catch (err) {
			assert(err.message === 'Bad siren component');
		}
	});
});

describe('creating sirenDefinedProperty incomplete objects', () => {

	it('property is not created from epmty object', () => {
		const obj = {};
		const res = sirenDefinedProperty(obj, null);
		assert(!res);
	});

	it('property is not created from object with useless fields', () => {
		const obj = { name: 'abc', token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert(!res);
	});

	it('property with type is created from objects observable field', () => {
		const obj = { observable: ot.link, token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert(res);
		assert(res.type === ot.link);
		assert(!res.token);
		assert(!res.route);
		assert(!res.id);
	});

	it('property with type and id is created from object with observable and rel fields', () => {
		const obj = { rel: 'abcde', observable: ot.link, token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert(res);
		assert(res.type === ot.link);
		assert(!res.token);
		assert(!res.route);
		assert(res.id === 'abcde');
	});

	it('property is not created from object with empty route', () => {
		const obj = { route: [], token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert(!res);
	});

	it('property is not created from object with one object with useless fields in route', () => {
		const obj = { route: [{ id: 987 }], token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert(!res);
	});

	it('property has observable from route and token from obj', () => {
		const obj = { route: [{ observable: ot.link }], token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert(res);

		assert(res.type === ot.link);
		assert(!res.id);
		assert(res.token === 1234);

		assert(res.route);
		assert(Object.keys(res.route).length === 2);
		assert(res.route.token === 1234);
		assert(res.route.route);
		assert(Object.keys(res.route.route).length === 0);
	});

	it('property has token and type from route', () => {
		const obj = { route: [{ observable: ot.link, token: 7489 }] };
		const res = sirenDefinedProperty(obj, null);

		assert(res);

		assert(res.type === ot.link);
		assert(res.token === 7489);
		assert(!res.id);

		assert(res.route);
		assert(Object.keys(res.route).length === 1);
		assert(res.route.route);
		assert(Object.keys(res.route.route).length === 0);
	});

	it('property has token from routes object, route uses objs token', () => {
		const obj = { route: [{ observable: ot.link, token: 7489 }], token: 1234 };
		const res = sirenDefinedProperty(obj, null);

		assert(res);

		assert(res.type === ot.link);
		assert(res.token === 7489);
		assert(!res.id);

		assert(res.route);
		assert(Object.keys(res.route).length === 2);

		assert(res.route.token === 1234);
		assert(Object.keys(res.route.route).length === 0);
	});

	it('property has token from first object in route. route contains second object from original route and token from obj', () => {
		const obj = { route: [{ observable: ot.link, token: 7489 }, { observable: ot.link, token: 42 }], token: 1234 };
		const res = sirenDefinedProperty(obj, null);

		assert(res);
		assert(res.type === ot.link);
		assert(res.token === 7489);
		assert(!res.id);

		assert(res.route);
		assert(Object.keys(res.route).length === 2);

		assert(res.route.token === 1234);

		assert(res.route.route);
		assert(Object.keys(res.route.route).length === 1);
		assert(res.route.route[0].observable === ot.link);
		assert(res.route.route[0].token === 42);
	});

	it('property created and contains token due to prime existing', () => {
		const obj = { prime: true, token: 1234, observable: ot.link };
		const res = sirenDefinedProperty(obj, null);

		assert(res);
		assert(!res.route);
		assert(res.type === ot.link);
		assert(res.token === 1234);
		assert(!res.id);
	});

	it('property created without token due to no token in obj', () => {
		const obj = { prime: true, observable: ot.link };
		const res = sirenDefinedProperty(obj, null);

		assert(res);
		assert(!res.route);
		assert(res.type === ot.link);
		assert(!res.token);
		assert(!res.id);
	});

	it('property created without token due to prime being false', () => {
		const obj = { prime: false, token: 1234, observable: ot.link };
		const res = sirenDefinedProperty(obj, null);

		assert(res);
		assert(!res.route);
		assert(res.type === ot.link);
		assert(!res.token);
		assert(!res.id);
	});
});

describe('calling sirenDefinedProperty with observable objects', () => {

	it('property created for sirenLink', () => {
		const obj = { type: String, observable: ot.link, rel: orgHref };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.link, res.type);
		assert(res.id === orgHref);
		assert(res.state === null);
	});

	it('property created for sirenLink a HypermediaState', () => {
		const obj = { type: String, observable: ot.link, rel: orgHref };
		const state = new HypermediaState(orgHref, 21312);
		const res = sirenDefinedProperty(obj, state);

		assert(res.type === ot.link);
		assert(res.state === state);
		assert(res.id === orgHref);
	});

	it('property created for sirenEntity. token does not exist', () => {
		const obj = { type: String, observable: ot.entity, rel: orgHref, token: 123123  };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.entity);
		assert(res.state === null);
		assert(res.id === orgHref);
		assert(!res.token);
	});

	it('property created for sirenSubEntities where token exists', () => {
		const obj = { type: String, observable: ot.subEntities, rel: orgHref, token: 123123 };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.subEntities);
		assert(res.token === 123123);
		assert(res.state === null);
		assert(res.id === orgHref);
	});

	it('property created for sirenSubEntity. token does not exist', () => {
		const obj = { type: String, observable: ot.subEntity, rel: orgHref, token: 123123 };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.subEntity);
		assert(!res.token);
		assert(res.state === null);
		assert(res.id === orgHref);
	});

	it('property created for sirenClasses. token does not exist', () => {
		const obj = { type: String, observable: ot.classes, rel: orgHref, token: 123123 };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.classes);
		assert(!res.token);
		assert(res.state === null);
		assert(res.id === orgHref);
	});

	it('property created for sirenAction. token does not exist', () => {
		const obj = { type: String, observable: ot.action, rel: orgHref, token: 123123 };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.action);
		assert(!res.token);
		assert(res.state === null);
		assert(res.id === orgHref);
	});

	it('property created for sirenProperty. id exists', () => {
		const obj = { type: String, observable: ot.property, token: 123123, name: '_hello' };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.property);
		assert(res.id === 'hello');
		assert(!res.token);
	});
});
