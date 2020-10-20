import 'd2l-fetch/d2l-fetch.js';
import { HypermediaState } from './HypermediaState.js';

export class StateStore {
	constructor() {
		this._states = new Map();
	}

	add(state) {
		if (!state || !state.entityId || !state.token.toString) {
			return;
		}

		const registrations = this._initContainer(this._states, state.entityId, state.token, new Map());
		if (!registrations.has(state)) {
			registrations.set(state, { refCount: 0 });
		}
		registrations.get(state).refCount++;
	}

	get(entityId, token) {
		const lowerCaseEntityId = entityId.toLowerCase();
		return this._states.has(token.toString()) && this._states.get(token.toString()).has(lowerCaseEntityId) && this._states.get(token.toString()).get(lowerCaseEntityId).keys().next().value;
	}

	makeNewState(entityId, token) {
		const state = this.get(entityId, token) || new HypermediaState(entityId, token);
		const registrations = this._initContainer(this._states, entityId, token, new Map());
		if (!registrations.has(state)) {
			registrations.set(state, { refCount: 0 });
		}

		return state;
	}

	remove(state) {
		if (!state || !state.entityId || !state.token.toString || !this._states) {
			return;
		}

		const registrations = this._initContainer(this._states, state.entityId, state.token, new Map());
		const refCount = --(registrations.get(state).refCount); // intentional substration.
		if (!refCount || refCount <= 0) {
			registrations.delete(state);
		}

	}

	_initContainer(map, entityId, token, init) {
		const lowerCaseEntityId = entityId.toLowerCase();
		const tokenCache = token.toString();
		if (!map.has(tokenCache)) {
			map.set(tokenCache, new Map());
		}
		const entityMap = map.get(tokenCache);
		if (init && !entityMap.has(lowerCaseEntityId)) {
			entityMap.set(lowerCaseEntityId, init);
		}
		return entityMap.get(lowerCaseEntityId);
	}

}
