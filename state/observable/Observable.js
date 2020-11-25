import { ObserverMap } from './ObserverMap.js';

export class Observable {

	constructor() {
		this._observers = new ObserverMap();
	}

	addObserver(observer, property, { method } = {}) {
		this._observers.add(observer, property, method);
	}

	createChildState(entityID, token) {
		return this._state.createChildState(entityID, token);
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
		if (this._childState) {
			this._childState.dispose(observer);
		}
		this._routes.delete(observer);
	}
}
