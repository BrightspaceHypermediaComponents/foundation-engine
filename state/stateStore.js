export class StateStore {
	constructor() {
		this._states = new Map();
	}

	add(state) {
		if (!state || !state.entityID || !state.token.toString()) {
			return;
		}

		const tokenMap = this._initTokenMap(state.token);
		tokenMap.set(state.entityID, state);
	}

	get(entityID, token) {
		const lowerCaseEntityID = entityID.toLowerCase();
		const tokenCache = token.toString();

		const state = this.has(entityID, token) && this._states.get(tokenCache).get(lowerCaseEntityID);

		return state;
	}

	has(entityID, token) {
		const lowerCaseEntityID = entityID.toLowerCase();
		const tokenCache = token.toString();

		return this._states.has(tokenCache) && this._states.get(tokenCache).has(lowerCaseEntityID);
	}

	_initTokenMap(token) {
		const tokenCache = token.toString();

		if (!this._states.has(tokenCache)) {
			this._states.set(tokenCache, new Map());
		}

		return this._states.get(tokenCache);
	}
}
