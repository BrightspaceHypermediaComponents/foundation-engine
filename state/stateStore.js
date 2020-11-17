class StateStore {
	constructor() {
		this._states = new Map();
	}

	add(state) {
		if (!state || !state.entityId || !state.token.toString) {
			return;
		}

		this._initContainer(state.entityId, state.token);
	}

	get(entityID, token) {
		const lowerCaseEntityId = entityID.toLowerCase();
		return this.has(entityID, token) && this._states.get(token.toString()).get(lowerCaseEntityId).keys().next().value;
	}

	has(entityID, token) {
		const lowerCaseEntityId = entityID.toLowerCase();
		return this._states.has(token.toString()) && this._states.get(token.toString()).has(lowerCaseEntityId);
	}

	_initContainer(entityId, token) {
		const lowerCaseEntityId = entityId.toLowerCase();
		const tokenCache = token.toString();
		if (!this._states.has(tokenCache)) {
			this._states.set(tokenCache, new Map());
		}
		const entityMap = this._states.get(tokenCache);
		if (!entityMap.has(lowerCaseEntityId)) {
			entityMap.set(lowerCaseEntityId, new Map());
		}
		return entityMap.get(lowerCaseEntityId);
	}
}
