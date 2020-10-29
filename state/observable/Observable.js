import { ObserverMap } from './ObserverMapjs';

export class Observable {

	constructor() {
		this._observers = new ObserverMap();
	}

	addObserver(observer, property, { method }, value) {
		this._observers.add(observer, property, method, value);
	}

	deleteObserver(observer) {
		this._observers.delete(observer);
	}
	setSirenEntity() {}

	setValue(oldValue, newValue) {
		if (oldValue !== newValue) {
			this._observers.setProperty(newValue);
		}
	}

	_addRoute(observer, route) {
		const currentRoute = this._routes.has(observer) ? this._routes.get(observer) : {};
		this._routes.set(observer, { ...currentRoute, ...route });
	}

	_deleteRoute(observer) {
		this._childState.dispose(observer);
		this._routes.delete(observer);
	}
}
