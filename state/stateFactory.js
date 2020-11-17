import 'd2l-fetch/d2l-fetch.js';
import { StateStore } from './stateStore.js';

export class StateFactory {
	constructor(fetch) {
		this._d2lfetch = fetch;
		this._store = new StateStore();
	}

	get(state) {
		if (this._store.has(state.entityID, state.token)) {
			return this._store.get(state.entityID, state.token);
		}
		const result = this._d2lfetch(state);
		this._store.add(result);
	}
}
