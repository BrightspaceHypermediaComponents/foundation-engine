/**
 * Routable mixin
 * Behaviour interface for objects that are routable
 * @mixin
 */
export const Routable = superclass => class extends superclass {
	constructor(object = {}) {
		super(object);
		this._routes = new Map();
	}

	get routedState() {
		return this._routedState;
	}

	set routedState(state) {
		this._routedState = state;
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

	createRoutedState(entityID, token) {
		return this._state.createRoutedState(entityID, token);
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
		if (this.routedState) {
			this.routedState.dispose(observer);
		}
		this._routes.delete(observer);
	}
};
