import { Fetchable, FetchError } from './Fetchable.js';
import { observableTypes as ot, sirenObservableFactory, sirenObserverDefinedProperty } from './observable/sirenObservableFactory.js';
import { fetch } from './fetch.js';
import { getToken } from './token.js';
import SirenParse from 'siren-parser';
import { StateStore } from './StateStore.js';

export const observableTypes = ot;

window.D2L = window.D2L || {};
window.D2L.Foundation = window.D2L.Foundation || {};
window.D2L.Foundation.StateStore = window.D2L.Foundation.StateStore || new StateStore();

const store = window.D2L.Foundation.StateStore;

/**
 *
 * @class HypermediaState
 */
class HypermediaState extends Fetchable(Object) {
	constructor(entityID, token) {
		super(entityID, token);

		this._decodedEntity = new Map();
	}

	addObservables(observer, observables) {
		Object.keys(observables).forEach((name) => {

			const propertyInfo = {
				name,
				token: this.token,
				...observables[name]
			};
			const basicInfo = sirenObserverDefinedProperty(propertyInfo, this);
			if (!basicInfo) return;
			const sirenObservable = this._getSirenObservable(basicInfo);
			sirenObservable.addObserver(observer, name, { route: basicInfo.route ? { [name]: basicInfo.route } : undefined, method: observables[name].method });
		});
	}
  
	/**
	 * Hook for this fetch and all children state fetches to complete
	 * This does not go further than a single nested state currently because state links can be cyclical
	 * @returns {Promise} Resolves when this fetch and its linked states are all complete
	 */
	get allFetchesComplete() {
		return (async() => {
			await this.fetchStatus.complete;
			await Promise.all(this._routedStates().map(state => state.fetchStatus.complete));
		})();
	}

	createRoutedState(entityID, token) {
		token = token === undefined ? this.token.rawToken : token;
		return stateFactory(entityID, token);
	}

	dispose(observer) {
		this._decodedEntity.forEach(typeMap => {
			typeMap.forEach(sirenObservable => {
				sirenObservable.deleteObserver(observer);
			});
		});
	}

	get entityID() {
		return this.href;
	}

	async handleCachePriming(links) {
		return Promise.all(links.map(async(link) => {
			const state = await stateFactory(link, this.token.rawToken);
			return fetch(state, true);
		}));
	}

	hasServerResponseCached() {
		return !!this._entity;
	}

	async onServerResponse(response, error) {
		if (error) throw new FetchError(error);

		const entity = await SirenParse(response);
		this.setSirenEntity(entity);
	}

	processRawJsonSirenEntity(json, token) {
		token = token === undefined ? this.token.rawToken : token;
		return processRawJsonSirenEntity(json, token);
	}

	push() {
		this._routedStates().forEach(routedState => routedState.push());
		const actions = this._getMap(this._decodedEntity, observableTypes.action);
		actions.forEach(action => action.push());
	}

	reset() {
		this._routedStates().forEach(routedState => routedState?.reset());
		this.setSirenEntity();
		const actions = this._getMap(this._decodedEntity, observableTypes.action);
		actions.forEach(action => action.reset());
	}

	setSirenEntity(entity = null) {
		if (entity && entity.href) {
			return;
		}
		this._entity = entity !== null ? entity : this._entity;
		this._decodedEntity.forEach(typeMap => {
			typeMap.forEach(sirenObservable => {
				sirenObservable.setSirenEntity(this._entity, typeMap);
			});
		});
	}

	updateProperties(observables) {
		Object.keys(observables).forEach((name) => {
			const propertyInfo = {
				name,
				token: this.token,
				state: this,
				...observables[name]
			};

			const basicInfo = sirenObserverDefinedProperty(propertyInfo);
			if (!basicInfo) return;
			const sirenObservable = this._getSirenObservable(basicInfo);
			sirenObservable && (sirenObservable.value = propertyInfo.value);
		});
	}

	_getMap(map, identifier) {
		if (map.has(identifier)) {
			return map.get(identifier);
		}

		map.set(identifier, new Map());
		return map.get(identifier);
	}
	_getSirenObservable(basicInfo) {
		const typeMap = this._getMap(this._decodedEntity, basicInfo.type);
		if (typeMap.has(basicInfo.id)) return typeMap.get(basicInfo.id);

		const sirenObservable = sirenObservableFactory(basicInfo);
		typeMap.set(basicInfo.id, sirenObservable);
		this._entity && sirenObservable.setSirenEntity(this._entity, typeMap);

		return sirenObservable;
	}
	_routedStates() {
		const routedStates = [];
		this._decodedEntity.forEach(typeMap => {
			typeMap.forEach(sirenObservable => {
				sirenObservable.routedState && routedStates.push(sirenObservable.routedState);
			});
		});
		return routedStates;
	}

}

export async function processRawJsonSirenEntity(json, rawToken) {
	const entity = await SirenParse(json);
	const entityID = entity.hasLinkByRel && entity.hasLinkByRel('self') && entity.getLinkByRel && entity.getLinkByRel('self').href;
	if (entityID) {
		const state = await stateFactory(entityID, rawToken);
		state.setSirenEntity(entity);
	}
	return entity;
}

export async function stateFactory(entityID, rawToken) {
	const token = await getToken(rawToken);
	if (store.has(entityID, token)) {
		const state = store.get(entityID, token);
		return state;
	}
	const state = new HypermediaState(entityID, token);
	store.add(state);
	return state;
}

export function dispose(state, observer) {
	state && state.dispose(observer);
}
