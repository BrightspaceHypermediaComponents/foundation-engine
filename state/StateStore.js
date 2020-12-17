export class StateStore {
	constructor() {
		this._states = new Map();
	}

	add(state) {
		if (!state || !state.entityID || !state.token?.toString()) {
			return;
		}

		const lowerCaseEntityID = state.entityID.toLowerCase();
		const tokenCache = state.token.toString();

		const tokenMap = this._initTokenMap(tokenCache);
		tokenMap.set(lowerCaseEntityID, state);
	}

	get(entityID, token) {
		const lowerCaseEntityID = entityID.toLowerCase();
		const tokenCache = token.toString();

		const state = this.has(entityID, token) && this._states.get(tokenCache).get(lowerCaseEntityID);

		return state;
	}

	has(entityID, token) {
		if (!entityID) return false;
		const lowerCaseEntityID = entityID.toLowerCase();
		const tokenCache = token.toString();

		return this._states.has(tokenCache) && this._states.get(tokenCache).has(lowerCaseEntityID);
	}

	_initTokenMap(tokenCache) {
		if (!this._states.has(tokenCache)) {
			this._states.set(tokenCache, new Map());
		}

		return this._states.get(tokenCache);
	}
}
