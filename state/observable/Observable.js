import { ObserverMap } from './ObserverMap.js';

export class Observable {

	constructor() {
		this._observers = new ObserverMap();
	}

	addObserver(observer, property, { method } = {}) {
		this._observers.add(observer, property, method);
	}

	deleteObserver(observer) {
		this._observers.delete(observer);
	}

	setSirenEntity() {}

	/**
	 * Updates the property on all observers
	 * @param value - The value to set the reflected property to
	 */
	updateProperty(value) {
		this._observers.setProperty(value);
	}
}
