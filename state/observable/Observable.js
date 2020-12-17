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
}
