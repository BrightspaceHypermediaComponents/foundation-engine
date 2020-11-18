import { SirenAction } from './SirenAction.js';
import { SirenClasses } from './SirenClasses.js';
import { SirenEntity } from './SirenEntity.js';
import { SirenLink } from './SirenLink.js';
import { SirenProperty } from './SirenProperty.js';
import { SirenSubEntities } from './SirenSubEntities.js';
import { SirenSubEntity } from './SirenSubEntity.js';

export const observableTypes = Object.freeze({
	property: 1,
	link: 2,
	classes: 3,
	subEntities: 4,
	entity: 5,
	subEntity: 6,
	action: 7
});

const observableClasses = Object.freeze({
	[observableTypes.classes]: SirenClasses,
	[observableTypes.entity]: SirenEntity,
	[observableTypes.link]: SirenLink,
	[observableTypes.property]: SirenProperty,
	[observableTypes.subEntity]: SirenSubEntity,
	[observableTypes.subEntities]: SirenSubEntities,
	[observableTypes.action]: SirenAction
});

function definedProperty({ observable: type, prime, rel: id, route, token, state }) {
	return {
		id,
		route,
		token: (prime || route) ? token : undefined,
		type,
		state
	};
}

function handleRouting(observerProperties) {
	if (!observerProperties.route || observerProperties.route.length === 0) return observerProperties;

	const currentProperties = observerProperties.route.shift();
	return { ...observerProperties, ...currentProperties, route: observerProperties };
}

export function sirenObserverDefinedProperty(observerProperties, state) {
	observerProperties = handleRouting(observerProperties);
	const sirenObserverType = observerProperties.observable && observableClasses[observerProperties.observable];
	if (!sirenObserverType) {
		return;
	}

	const definedObserverProperty = sirenObserverType.definedProperty ? sirenObserverType.definedProperty(observerProperties) : {};

	return { ...definedProperty(observerProperties), ...definedObserverProperty, state };
}

export function sirenObservableFactory(componentProperties) {
	const sirenComponentType = componentProperties.type && observableClasses[componentProperties.type];
	if (!sirenComponentType) {
		throw new Error('Bad siren component');
	}

	return new sirenComponentType(componentProperties);
}
