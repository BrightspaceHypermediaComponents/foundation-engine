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
		this._entity = null;
		this._decodedEntity = new Map();
		this._parents = new Map();
		this._waitForFirstFetch = entityID && this.fetchStatus.waitForNextFetch;
		this._observers = [];
		this._childHrefs = [];
	}

	get childHrefs() { return this._childHrefs; }

	get entityID() {
		return this.href;
	}

	get isSelfless() {
		return !this.href;
	}

	addObservables(observer, observables) {
		this._observers.push(observer);
		Object.keys(observables).forEach((name) => {
			const propertyInfo = {
				name,
				token: this.token,
				...observables[name]
			};
			const definedProperty = sirenObserverDefinedProperty(propertyInfo, this);
			if (!definedProperty) return;
			const sirenObservable = this._getSirenObservable(definedProperty);
			const options = { ...definedProperty, route: definedProperty.route ? { [name]: definedProperty.route } : undefined };
			sirenObservable.addObserver(observer, name, options);
		});
	}

	addParent(state) {
		this._parents.set(state, true);
	}

	/**
	 * Hook for this fetch and all children state fetches to complete
	 * @returns {Promise} Resolves when this fetch and its linked states are all complete
	 */
	async allFetchesComplete(skipTheseStates) {
		await this._waitForFirstFetch;
		await this.fetchStatus.complete;
		skipTheseStates = Array.isArray(skipTheseStates) ? skipTheseStates : [skipTheseStates];
		const skipTheseStatesOnNextStep = [ this, ...skipTheseStates ];
		const parentPromises = [];
		this._parents.forEach((_, parent) => {
			if (!skipTheseStates.includes(parent)) {
				parentPromises.push(parent.allFetchesComplete(skipTheseStatesOnNextStep));
			}
		});
		await Promise.all(parentPromises);
		await Promise.all(this._routedStates()
			.filter(state => !skipTheseStates.includes(state))
			.map(state => state.allFetchesComplete(skipTheseStatesOnNextStep)));
	}

	byPassCache() {
		this._entity = null;
	}

	createRoutedState(entityID, token) {
		entityID && this._childHrefs.push(entityID);
		token = token === undefined ? this.token.rawToken : token;
		return stateFactory(entityID, token)
			.then(state => {
				state.addParent(this);
				return state;
			});
	}

	dispose(observer) {
		this._decodedEntity.forEach(typeMap => {
			typeMap.forEach(sirenObservable => {
				sirenObservable.deleteObserver(observer);
			});
		});
		this._observers = this._observers.filter(oldObserver => observer !== oldObserver);
	}

	handleCachePriming(links, token = null) {
		token = token !== null ? token : this.token;
		return Promise.all(links.map(async(link) => {
			const state = await stateFactory(link, token.rawToken);
			return fetch(state);
		}));
	}

	hasServerResponseCached() {
		return this._entity !== null;
	}

	async onServerResponse(response, error) {
		if (error) throw new FetchError(error);

		const entity = await SirenParse(response);
		await this.setSirenEntity(entity);
	}

	processRawJsonSirenEntity(json, token) {
		token = token === undefined ? this.token.rawToken : token;
		return processRawJsonSirenEntity(json, token);
	}

	async push() {
		this._stopUpdates = true;
		const actions = [];

		this._routedStates().forEach(action => actions.push(action));
		const actionMap = this._getMap(this._decodedEntity, observableTypes.action);

		actionMap.forEach(action => actions.push(action));
		for await (const action of actions) {
			await action.push();
		}
		this._stopUpdates = false;
	}

	reset() {
		this._routedStates().forEach(routedState => routedState?.reset());
		this.setSirenEntity();
		const actions = this._getMap(this._decodedEntity, observableTypes.action);
		actions.forEach(action => action.reset());
	}

	async setSirenEntity(entity = null) {
		if ((entity && entity.href) || this._stopUpdates || this.hasServerResponseCached()) return;
		this._entity = entity !== null ? entity : this._entity;

		const setSirenEntityPromises = [];
		this._decodedEntity.forEach(typeMap => {
			typeMap.forEach(sirenObservable => {
				setSirenEntityPromises.push(sirenObservable.setSirenEntity(this._entity, typeMap));
			});
		});
		await Promise.all(setSirenEntityPromises);
	}

	/**
	 * Updates the states of the observables passed to it - changes will register
	 * in all components that are observing
	 * @param { Object } observables - The observables to update, as defined by the component
	 */
	updateProperties(observables) {
		Object.keys(observables).forEach((name) => {
			const propertyInfo = {
				name,
				token: this.token,
				state: this,
				...observables[name]
			};

			let definedProperty = sirenObserverDefinedProperty(propertyInfo, this);
			if (!definedProperty) return;
			let state = this;
			while (definedProperty.route && definedProperty.route.length !== 0) {
				const observable = state._getSirenObservable(definedProperty);
				state = observable && observable.routedState;
				if (!state) return;
				definedProperty = sirenObserverDefinedProperty(definedProperty.route, state);
			}

			const sirenObservable = state._getSirenObservable(definedProperty);
			sirenObservable && (sirenObservable.updateProperty(propertyInfo.value));
		});
	}

	async waitAfterFetch() {
		for await (const observer of this._observers) {
			if (!observer.updateComplete) continue;
			await observer.updateComplete;
		}
	}

	_getMap(map, identifier) {
		if (map.has(identifier)) {
			return map.get(identifier);
		}

		map.set(identifier, new Map());
		return map.get(identifier);
	}

	_getSirenObservable(definedProperty) {
		const typeMap = this._getMap(this._decodedEntity, definedProperty.type);
		if (typeMap.has(definedProperty.id)) return typeMap.get(definedProperty.id);

		const sirenObservable = sirenObservableFactory(definedProperty);
		typeMap.set(definedProperty.id, sirenObservable);
		this._entity && sirenObservable.setSirenEntity(this._entity, typeMap);

		return sirenObservable;
	}

	_routedStates() {
		const routedStates = [];
		this._decodedEntity.forEach(typeMap => {
			typeMap.forEach(sirenObservable => {
				if (!sirenObservable.routedState) return;
				sirenObservable = Array.isArray(sirenObservable.routedState) ? sirenObservable.routedState : [sirenObservable.routedState];
				sirenObservable.forEach(routedState => routedState && routedStates.push(routedState));
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
	if (entityID) {
		store.add(state);
	}
	return state;
}

export function dispose(state, observer) {
	state && state.dispose(observer);
}

export function clearStore() {
	store.clear();
}
