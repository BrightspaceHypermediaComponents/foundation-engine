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

		const tokenMap = this._initTokenMap(state.token);
		tokenMap.set(state.entityId, state);
	}

	async get(entityID, token) {
		await refreshToken(token);
		const lowerCaseEntityId = entityID.toLowerCase();
		const tokenCache = token.toString();

		const state = this.has(entityID, token) && this._states.get(tokenCache).get(lowerCaseEntityId);

		return state;
	}

	async has(entityID, token) {
		await refreshToken(token);
		const lowerCaseEntityId = entityID.toLowerCase();
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
