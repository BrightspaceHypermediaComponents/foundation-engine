import { Component } from './Common.js';
import { observableClasses } from 'sirenComponentFactory.js';

function defaultBasicInfo({ observable: type, prime, rel: id, route, token }) {
	return {
		id,
		route,
		token: (prime || route) ? token : undefined,
		type
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

	const definedProperty = sirenObserverType.basicInfo ? sirenObserverType.definedProperty(observerProperties) : {};

	return { ...defaultBasicInfo(observerProperties), ...definedProperty, state };
}

export class Observable {
	static definedProperty({ name: id, token, state }) {
		return { id, token, state };
	}

	// TODO: change to ObserverMap in US121366
	constructor() {
		this._observers = new Component(); // new ObserverMap()
	}

	addObserver(observer, property, { method }, value) {
		this._observers.add(observer, property, method);
		this._observers.setObserverProperty(observer, value);
	}

	deleteObserver(observer) {
		this._observers.delete(observer);
	}
	setSirenEntity() {}

	_addRoute(observer, route) {
		const currentRoute = this._routes.has(observer) ? this._routes.get(observer) : {};
		this._routes.set(observer, { ...currentRoute, ...route });
	}

	_deleteRoute(observer) {
		this._childState.dispose(observer);
		this._routes.delete(observer);
	}
}
