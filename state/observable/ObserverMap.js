export class ObserverMap {
	constructor() {
		this._observers = new Map();
		this._methods = new WeakMap();
		this.value = {};
	}

	add(component, property, method, value) {
		if (this._observers.has(component)) {
			return;
		}

		this.value = value;
		this._observers.set(component, property);
		method && this._methods.set(component, method);
		this._setObserverProperty(component, value);
	}

	delete(component) {
		this._methods.delete(component);
		return this._observers.delete(component);
	}

	setProperty(value) {
		this.value = value;

		this._observers.forEach((property, component) => {
			const method = this._methods.has(component) && this._methods.get(component);
			component[property] = method ? method(this.value) : this.value;
		});
	}

	_setObserverProperty(component) {
		const method = this._methods.has(component) && this._methods.get(component);
		component[this._observers.get(component)] = method ? method(this.value) : this.value;
	}

}

export function getEntityIdFromSirenEntity(entity) {
	const self = entity.hasLinkByRel && entity.hasLinkByRel('self') && entity.getLinkByRel && entity.getLinkByRel('self');
	return  entity.href || (self && self.href);
}
