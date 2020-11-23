import { observableTypes as ot, sirenObserverDefinedProperty, sirenObserverFactory } from './observable/sirenObserverFactory.js';
import { fetch } from './fetch.js';
import { Fetchable } from './Fetchable.js';
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
 * @export
 * @class HypermediaState
 */
export class HypermediaState extends Fetchable(Object) {
	constructor(entityId, token) {
		super(entityId, token);

		this._decodedEntity = new Map();
	}

	addObservables(component, observables) {
		Object.keys(observables).forEach((name) => {
			const propertyInfo = {
				name,
				token: this.token,
				...observables[name]
			};

			const basicInfo = sirenObserverDefinedProperty(propertyInfo, this);
			if (!basicInfo) return;

			const sirenComponent = this._getSirenComponent(basicInfo);
			sirenComponent.addObserver(component, name, { route: basicInfo.route ? { [name]: basicInfo.route } : undefined, method: observables[name].method });
		});
	}

	dispose(component) {
		this._decodedEntity.forEach(typeMap => {
			typeMap.forEach(sirenComponent => {
				sirenComponent.delete(component);
			});
		});
	}

	get entityId() {
		return this.href;
	}

	async handleCachePriming(links) {
		return Promise.all(links.map(async(link) => {
			const state = await stateFactory(link, this.token);
			return fetch(state, true);
		}));
	}

	hasServerResponseCached() {
		return !!this._entity;
	}

	async onServerResponse(response, error) {
		if (!response) throw error;

		const entity = await SirenParse(response);
		this.setSirenEntity(entity);
	}

	push() {
		this._childStates().forEach(childState => childState.push());
		const actions = this._getMap(this._decodedEntity, observableTypes.action);
		actions.forEach(action => action.push());
	}

	reset() {
		this._childStates().forEach(childState => childState?.reset());
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
			typeMap.forEach(sirenComponent => {
				sirenComponent.setSirenEntity(this._entity, typeMap);
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

			const sirenComponent = this._getSirenComponent(basicInfo);
			sirenComponent && (sirenComponent.value = propertyInfo.value);
		});
	}

	_childStates() {
		let childStates = [];
		this._decodedEntity.forEach(typeMap => {
			typeMap.forEach(sirenComponent => {
				childStates = [...childStates, ...(sirenComponent.childStates || [])];
				sirenComponent.childState && childStates.push(sirenComponent.childState);
			});
		});
		return childStates;
	}

	_getMap(map, identifier) {
		if (map.has(identifier)) {
			return map.get(identifier);
		}

		map.set(identifier, new Map());
		return map.get(identifier);
	}

	_getSirenComponent(basicInfo) {
		const typeMap = this._getMap(this._decodedEntity, basicInfo.type);
		if (typeMap.has(basicInfo.id)) return typeMap.get(basicInfo.id);

		const sirenComponent = sirenObserverFactory(basicInfo);
		typeMap.set(basicInfo.id, sirenComponent);
		this._entity && sirenComponent.setSirenEntity(this._entity, typeMap);

		return sirenComponent;
	}
}

export async function stateFactory(entityId, token) {
	token = await getToken(token);
	if (await store.has(entityId, token)) {
		return store.get(entityId, token);
	}
	const state = new HypermediaState(entityId, token);
	await store.add(state);
	return state;
}

export function dispose(state, component) {
	state && state.dispose(component);
}
