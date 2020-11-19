import { observableTypes as ot, sirenComponentBasicInfo, sirenComponentFactory } from './sirenComponents/sirenComponentFactory.js';
import { Fetchable } from './Fetchable.js';
import { StateStore } from './stateStore.js';

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

			const basicInfo = sirenComponentBasicInfo(propertyInfo, this);
			if (!basicInfo) return;

			const sirenComponent = this._getSirenComponent(basicInfo);
			sirenComponent.addComponent(component, name, { route: basicInfo.route ? { [name]: basicInfo.route } : undefined, method: observables[name].method });
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

	hasServerResponseCached() {
		return !!this._entity;
	}

	onServerResponse(entity, error) {
		if (!entity) throw error;
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

			const basicInfo = sirenComponentBasicInfo(propertyInfo);
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

		const sirenComponent = sirenComponentFactory(basicInfo);
		typeMap.set(basicInfo.id, sirenComponent);
		this._entity && sirenComponent.setSirenEntity(this._entity, typeMap);

		return sirenComponent;
	}
}

export async function stateFactory(entityID, token) {
	if (await store.has(entityID, token)) {
		return await store.get(entityID, token);
	}
	const state = new HypermediaState(entityID, token);
	await store.add(state);
	return state;
}
