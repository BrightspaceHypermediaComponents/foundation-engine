export class ObserverMap {
	constructor() {
		this._observerMap = new Map();
        this._methods = new WeakMap();
	}

	add(observer, property, method) {
		if (this._observerMap.has(observer)) {
			return;
		}
		this._observerMap.set(observer, property);
		method && this._methods.set(observer, method);
	}

	delete(observer) {
		this._methods.delete(observer);
		return this._observerMap.delete(observer);
	}

	setComponentProperty(observer, value) {
		if (!this._observerMap.has(observer)) {
			return false;
		}
		const method = this._methods.has(observer) && this._methods.get(observer);

		observer[this._observerMap.get(observer)] = method ? method(value) : value;
	}

	setProperty(value) {

		this._observerMap.forEach((property, observer) => {
			const method = this._methods.has(observer) && this._methods.get(observer);
			observer[property] = method ? method(value) : value;
		});
	}

}

export function getEntityIdFromSirenEntity(entity) {
	const self = entity.hasLinkByRel && entity.hasLinkByRel('self') && entity.getLinkByRel && entity.getLinkByRel('self');
	return  entity.href || (self && self.href);
}
