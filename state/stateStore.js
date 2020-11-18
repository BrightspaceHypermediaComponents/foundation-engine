export class StateStore {
	constructor() {
		this._states = new Map();
	}

	add(state) {
		if (!state || !state.entityId || !state.token.toString()) {
			return;
		}

		const tokenMap = this._initTokenMap(state.token);
		tokenMap.set(state.entityId, state);
	}

	get(entityId, token) {
		const lowerCaseEntityId = entityId.toLowerCase();
		const tokenCache = token.toString();

		const state = this.has(entityId, token) && this._states.get(tokenCache).get(lowerCaseEntityId);

		return state;
	}

	has(entityId, token) {
		const lowerCaseEntityId = entityId.toLowerCase();
		const tokenCache = token.toString();

		return this._states.has(tokenCache) && this._states.get(tokenCache).has(lowerCaseEntityId);
	}

	_initTokenMap(token) {
		const tokenCache = token.toString();

		if (!this._states.has(tokenCache)) {
			this._states.set(tokenCache, new Map());
		}

		return this._states.get(tokenCache);
	}
}
