import { observableTypes as ot, sirenObservableFactory } from '../state/observable/sirenObservablesFactory.js'; // sirenDefinedProperty
import { assert }  from '@open-wc/testing';
//import { HypermediaState } from '../state/HypermediaState.js';
import { SirenAction } from '../state/observable/SirenAction.js';
import { SirenClasses } from '../state/observable/SirenClasses.js';
import { SirenEntity } from '../state/observable/SirenEntity.js';
import { SirenLink } from '../state/observable/SirenLink.js';
import { SirenProperty } from '../state/observable/SirenProperty.js';
import { SirenSubEntities } from '../state/observable/SirenSubEntities.js';
import { SirenSubEntity } from '../state/observable/SirenSubEntity.js';

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
