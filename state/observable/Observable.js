import { Component } from './Common.js';

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
