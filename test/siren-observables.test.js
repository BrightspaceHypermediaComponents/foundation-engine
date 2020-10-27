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
	it('SirenAction', () => {
		const propertyInfo = {
			type: ot.action
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenAction);
	});
	it('SirenClasses', () => {
		const propertyInfo = {
			type: ot.classes
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenClasses);
	});
	it('SirenProperty', () => {
		const propertyInfo = {
			type: ot.property
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenProperty);
	});
	it('SirenLink', () => {
		const propertyInfo = {
			type: ot.link
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenLink);
	});
	it('SirenEntity', () => {
		const propertyInfo = {
			type: ot.entity
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenEntity);
	});
	it('SirenSubEntities', () => {
		const propertyInfo = {
			type: ot.subEntities
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenSubEntities);
	});
	it('SirenSubEntity', () => {
		const propertyInfo = {
			type: ot.subEntity
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenSubEntity);
	});
	it('fake class', () => {
		const propertyInfo = {
			type: 8
		};
		try {
			sirenObservableFactory(propertyInfo);
		} catch (err) {
			assert(err.message === 'Bad siren component');
		}
	});
	it('type missing in property', () => {
		const propertyInfo = {
		};
		try {
			sirenObservableFactory(propertyInfo);
		} catch (err) {
			assert(err.message === 'Bad siren component');
		}
	});
});

describe('sirenDefinedProperty incomplete properties', () => {

	it('empty object', () => {
		const obj = {};
		const res = sirenDefinedProperty(obj, null);
		assert(!res);
	});

	it('useless object', () => {
		const obj = { name: 'abc', token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert(!res);
	});

	it('observable object, no route/prime', () => {
		const obj = { observable: ot.link, token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert(res);
		assert(res.type === ot.link);
		assert(!res.token);
		assert(!res.route);
		assert(!res.id);
	});

	it('rel in object', () => {
		const obj = { rel: 'abcde', observable: ot.link, token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert(res);
		assert(res.type === ot.link);
		assert(!res.token);
		assert(!res.route);
		assert(res.id === 'abcde');
	});

	it('empty route', () => {
		const obj = { route: [], token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert(!res);
	});

	it('nonempty route that is not observable', () => {
		const obj = { route: [{ id: 987 }], token: 1234 };
		const res = sirenDefinedProperty(obj, null);
		assert(!res);
	});

	it('nonempty route, token outside route', () => {
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

	it('nonempty route, token within route', () => {
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

	it('nonempty route, two tokens', () => {
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

	it('route multiple items', () => {
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

	it('prime with token', () => {
		const obj = { prime: true, token: 1234, observable: ot.link };
		const res = sirenDefinedProperty(obj, null);

		assert(res);
		assert(!res.route);
		assert(res.type === ot.link);
		assert(res.token === 1234);
		assert(!res.id);

	});

	it('prime without token', () => {
		const obj = { prime: true, observable: ot.link };
		const res = sirenDefinedProperty(obj, null);

		assert(res);
		assert(!res.route);
		assert(res.type === ot.link);
		assert(!res.token);
		assert(!res.id);

	});
});

describe('sirenDefinedProperty complete properties', () => {
	it('sirenLink', () => {
		const obj = { type: String, observable: ot.link, rel: orgHref };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.link, res.type);
		assert(res.id === orgHref);
		assert(res.state === null);
	});

	it('sirenLink with HypermediaState', () => {
		const obj = { type: String, observable: ot.link, rel: orgHref };
		const state = new HypermediaState(orgHref, 21312);
		const res = sirenDefinedProperty(obj, state);

		assert(res.type === ot.link);
		assert(res.state === state);
		assert(res.id === orgHref);
	});

	it('sirenEntity', () => {
		const obj = {type: String, observable: ot.entity, rel: orgHref, token: 123123  };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.entity);
		assert(res.state === null);
		assert(res.id === orgHref);
		assert(!res.token);
	});

	it('sirenSubEntities', () => {
		const obj = { type: String, observable: ot.subEntities, rel: orgHref, token: 123123 };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.subEntities);
		assert(res.token === 123123);
		assert(res.state === null);
		assert(res.id === orgHref);
	});

	it('sirenSubEntity', () => {
		const obj = { type: String, observable: ot.subEntity, rel: orgHref, token: 123123 };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.subEntity);
		assert(!res.token);
		assert(res.state === null);
		assert(res.id === orgHref);
	});

	it('sirenClasses', () => {
		const obj = { type: String, observable: ot.classes, rel: orgHref, token: 123123 };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.classes);
		assert(!res.token);
		assert(res.state === null);
		assert(res.id === orgHref);
	});

	it('sirenAction', () => {
		const obj = { type: String, observable: ot.action, rel: orgHref, token: 123123 };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.action);
		assert(!res.token);
		assert(res.state === null);
		assert(res.id === orgHref);
	});
});

describe('sirenProperty id', () => {
	it('name', () => {
		const obj = { type: String, observable: ot.property, token: 123123, name: 'hello' };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.property);
		assert(res.id === 'hello');
		assert(!res.token);
	});

	it('href', () => {
		const obj = { type: String, observable: ot.property, id: orgHref, token: 123123 };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.property);
		assert(res.id === orgHref);
		assert(!res.token);
	});

	it('href and name', () => {
		const obj = { type: String, observable: ot.property, id: orgHref, token: 123123, name: 'hello' };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.property);
		assert(res.id === orgHref);
		assert(!res.token);
	});

	it('name begins with one underscore', () => {
		const obj = { type: String, observable: ot.property, token: 123123, name: '_hello' };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.property);
		assert(res.id === 'hello');
		assert(!res.token);
	});

	it('name begins with multiple underscores', () => {
		const obj = { type: String, observable: ot.property, token: 123123, name: '_____hello' };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.property);
		assert(res.id === 'hello');
		assert(!res.token);
	});

	it('name is snake_case', () => {
		const obj = { type: String, observable: ot.property, token: 123123, name: 'this_is_a_test' };
		const res = sirenDefinedProperty(obj, null);

		assert(res.type === ot.property);
		assert(res.id === 'this_is_a_test');
		assert(!res.token);
	});
});
