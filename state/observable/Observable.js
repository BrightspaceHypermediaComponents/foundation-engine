import { Component } from './Common.js';

export class Observable {
	static definedProperty({ name: id, token, state }) {
		return { id, token, state };
	}

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

	setSirenEntity() {
	}
}
