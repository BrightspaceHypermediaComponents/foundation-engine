export class ObserverMap {
	constructor() {
		this._observers = new Map();
		this._methods = new WeakMap();
		this.value = undefined;
	}

	add(observer, property, method) {
		if (this._observers.has(observer)) {
			return;
		}

		this.value = value;
		this._observers.set(observer, property);
		method && this._methods.set(observer, method);
	}

	delete(observer) {
		this._methods.delete(observer);
		return this._observers.delete(observer);
	}

	setProperty(value) {
		this.value = value;

		this._observers.forEach((property, observer) => {
			const method = this._methods.has(observer) && this._methods.get(observer);
			observer[property] = method ? method(this.value) : this.value;
		});
	}

	_setObserverProperty(observer) {
		const method = this._methods.has(observer) && this._methods.get(observer);
		observer[this._observers.get(observer)] = method ? method(this.value) : this.value;
	}

}

export function getEntityIdFromSirenEntity(entity) {
	const self = entity.hasLinkByRel && entity.hasLinkByRel('self') && entity.getLinkByRel && entity.getLinkByRel('self');
	return  entity.href || (self && self.href);
}
