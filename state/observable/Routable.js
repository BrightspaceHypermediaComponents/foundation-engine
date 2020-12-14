/**
 * Routable mixin
 * Behaviour interface for objects that are routable
 * @mixin
 */
export const Routable = superclass => class extends superclass {
	constructor({ id, token, state }) {
		super({ id, token, state });
		this._routes = new Map();
	}

	get childState() {
		return this._childState;
	}

	set childState(state) {
		this._childState = state;
	}

	/**
	 * @param {Object} observer
	 * @param {string} property
	 * @param {Object} obj
	 * @param {Object} obj.route - An object containing information on the route to go through
	 * @param {function} obj.method - A function that will mutate the value before setting the property
	 */
	addObserver(observer, property, { route, method } = {}) {
		if (route) {
			this._addRoute(observer, route);
		} else {
			super.addObserver(observer, property, { method });
		}
	}

	deleteObserver(observer) {
		if (this._routes.has(observer)) {
			this._deleteRoute(observer);
		} else {
			super.deleteObserver(observer);
		}
	}

	_addRoute(observer, route) {
		const currentRoute = this._routes.has(observer) ? this._routes.get(observer) : {};
		this._routes.set(observer, { ...currentRoute, ...route });
	}

	_deleteRoute(observer) {
		if (this._childState) {
			this._childState.dispose(observer);
		}
		this._routes.delete(observer);
	}
};
