import { RefreshState } from './RefreshState.js';
import { SirenAction } from './SirenAction.js';
import { SirenClasses } from './SirenClasses.js';
import { SirenEntity } from './SirenEntity.js';
import { SirenLink } from './SirenLink.js';
import { SirenProperty } from './SirenProperty.js';
import { SirenSubEntities } from './SirenSubEntities.js';
import { SirenSubEntity } from './SirenSubEntity.js';
import { SirenSummonAction } from './SirenSummonAction.js';

export const observableTypes = Object.freeze({
	property: 1,
	link: 2,
	classes: 3,
	subEntities: 4,
	entity: 5,
	subEntity: 6,
	action: 7,
	summonAction: 8,
	custom: 9,
	refreshState: 10
});

const observableClasses = Object.freeze({
	[observableTypes.classes]: SirenClasses,
	[observableTypes.entity]: SirenEntity,
	[observableTypes.link]: SirenLink,
	[observableTypes.property]: SirenProperty,
	[observableTypes.subEntity]: SirenSubEntity,
	[observableTypes.subEntities]: SirenSubEntities,
	[observableTypes.action]: SirenAction,
	[observableTypes.summonAction]: SirenSummonAction,
	[observableTypes.refreshState]: RefreshState
});

/**
 *
 * @param {*} param0
 */
function definedProperty({ observable: type, observableObject: typeObject, prime, rel: id, route, token, state, method }) {
	return {
		id,
		route,
		token: (prime || (route && route.length !== 0)) ? token : undefined,
		type,
		typeObject,
		state,
		method
	};
}

function getObservableObject(observableType, observableCustomObject) {
	if (observableType === observableTypes.custom) {
		return observableCustomObject;
	}
	return observableType && observableClasses[observableType];

}

function handleRouting(observerProperties) {
	if (!observerProperties.route || observerProperties.route.length === 0) return observerProperties;

	const currentProperties = observerProperties.route.shift();
	return { ...observerProperties, ...currentProperties, route: observerProperties };
}

export function sirenObserverDefinedProperty(observerProperties, state) {
	observerProperties = handleRouting(observerProperties);
	const sirenObserverType = getObservableObject(observerProperties.observable, observerProperties.observableObject);
	if (!sirenObserverType) {
		return;
	}

	const definedObserverProperty = sirenObserverType.definedProperty ? sirenObserverType.definedProperty(observerProperties) : {};

	return { ...definedProperty(observerProperties), ...definedObserverProperty, state };
}

export function sirenObservableFactory(componentProperties) {
	const sirenComponentType = getObservableObject(componentProperties.type, componentProperties.typeObject);
	if (!sirenComponentType) {
		throw new Error('Bad siren component');
	}
	return new sirenComponentType(componentProperties);
}
