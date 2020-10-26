import { observableTypes as ot, sirenDefinedProperty, sirenObservableFactory } from '../state/observable/sirenObservablesFactory.js'; // , sirenObservableFactory
import { assert }  from '@open-wc/testing';
//import { HypermediaState } from '../state/HypermediaState.js';
import { SirenAction } from '../state/observable/SirenAction.js';
import { SirenClasses } from '../state/observable/SirenClasses.js';
import { SirenEntity } from '../state/observable/SirenEntity.js';
import { SirenLink } from '../state/observable/SirenLink.js';
import { SirenProperty } from '../state/observable/SirenProperty.js';
import { SirenSubEntities } from '../state/observable/SirenSubEntities.js';
import { SirenSubEntity } from '../state/observable/SirenSubEntity.js';

describe('observerFactory creation', () => {
	it('SirenAction', () => {
		const propertyInfo = {
			name: 'foo',
			token: 'bar',
			type: ot.action
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenAction);
	});
	it('SirenClasses', () => {
		const propertyInfo = {
			name: 'foo',
			token: 'bar',
			type: ot.classes
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenClasses);
	});
	it('SirenProperty', () => {
		const propertyInfo = {
			name: 'foo',
			token: 'bar',
			type: ot.property
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenProperty);
	});
	it('SirenLink', () => {
		const propertyInfo = {
			name: 'foo',
			token: 'bar',
			type: ot.link
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenLink);
	});
	it('SirenEntity', () => {
		const propertyInfo = {
			name: 'foo',
			token: 'bar',
			type: ot.entity
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenEntity);
	});
	it('SirenSubEntities', () => {
		const propertyInfo = {
			name: 'foo',
			token: 'bar',
			type: ot.subEntities
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenSubEntities);
	});
	it('SirenSubEntity', () => {
		const propertyInfo = {
			name: 'foo',
			token: 'bar',
			type: ot.subEntity
		};
		const basicInfo = sirenObservableFactory(propertyInfo);
		assert(basicInfo instanceof SirenSubEntity);
	});
	it('fake class', () => {
		const propertyInfo = {
			name: 'foo',
			token: 'bar',
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
			name: 'foo',
			token: 'bar',
		};
		try {
			sirenObservableFactory(propertyInfo);
		} catch (err) {
			assert(err.message === 'Bad siren component');
		}
	});
});
