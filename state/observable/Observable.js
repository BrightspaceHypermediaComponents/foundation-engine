import { ObserverMap } from './ObserverMapjs';

export class Observable {

	constructor() {
		this._observers = new ObserverMap();
	}

	addObserver(observer, property, { method }) {
		this._observers.add(observer, property, method);
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
