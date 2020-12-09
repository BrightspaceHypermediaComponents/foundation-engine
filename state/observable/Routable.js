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
	 * @param {} route
	 * @param {function} method
	 */
	addObserver(observer, property, { route, method } = {}) {
		if (route) {
			this._addRoute(observer, route);
		} else {
			super.addObserver(observer, property, { method });
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
