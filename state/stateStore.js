import { refreshToken } from './token.js';

export class StateStore {
	constructor() {
		this._states = new Map();
	}

	async add(state) {
		await state.refreshToken();
		if (!state || !state.entityId || !state.token.toString()) {
			return;
		}

		this._initContainer(state.entityId, state.token);
	}

	async get(entityID, token) {
		await refreshToken(token);
		const lowerCaseEntityId = entityID.toLowerCase();
		const tokenCache = token.toString();

		const state = this.has(entityID, token) && this._states.get(tokenCache).get(lowerCaseEntityId).keys().next().value;
		state.refreshToken();
		return state;
	}

	async has(entityID, token) {
		await refreshToken(token);
		const lowerCaseEntityId = entityID.toLowerCase();
		const tokenCache = token.toString();

		return this._states.has(tokenCache) && this._states.get(tokenCache).has(lowerCaseEntityId);
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
