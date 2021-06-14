import { deepCopy } from '../../helper/deepCopy.js';

export class ObserverMap {
	constructor() {
		this._observers = new Map();
		this._methods = new WeakMap();
	}

	get value() {
		return this._value;
	}

	add(observer, property, method) {

		if (observer === undefined || typeof observer !== 'object') {
			return;
		}

		if (property === undefined || typeof property !== 'string') {
			return;
		}

		if (this._observers.has(observer)) {
			return;
		}

		this._observers.set(observer, property);

		if (method) {
			this._methods.set(observer, method);
		}

		if (this._value !== undefined) {
			this._setObserverProperty(observer, property);
		}
	}

	delete(observer) {
		this._methods.delete(observer);
		return this._observers.delete(observer);
	}

	merge(observerMap) {
		observerMap._observers.forEach((property, observer) => {
			this.add(observer, property, observerMap._methods.get(observer));
		});
	}

	setProperty(value) {
		this._value = value;

		this._observers.forEach((property, observer) => {
			this._setObserverProperty(observer, property);
		});
	}

	_setObserverProperty(observer, property) {
		const method = this._methods.has(observer) && this._methods.get(observer);
		const value = deepCopy(this.value);
		observer[property] = method ? method(value) : value;
	}

}

export function getEntityIDFromSirenEntity(entity) {
	const self = entity.hasLinkByRel && entity.hasLinkByRel('self') && entity.getLinkByRel && entity.getLinkByRel('self');
	return  entity.href || (self && self.href);
}
