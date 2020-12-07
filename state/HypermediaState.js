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
 * @export
 * @class HypermediaState
 */
export class HypermediaState extends Fetchable(Object) {
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
			//console.log(`addObservables: name: ${name}; propertyInfo: ${JSON.stringify(propertyInfo)}`);
			const basicInfo = sirenObserverDefinedProperty(propertyInfo, this);
			console.log(basicInfo);
			if (!basicInfo) return;

			const sirenObservable = this._getSirenObservable(basicInfo);
			sirenObservable.addObserver(observer, name, { route: basicInfo.route ? { [name]: basicInfo.route } : undefined, method: observables[name].method });
		});
	}

	createChildState(entityID, token) {
		token = token === undefined ? this.token.rawToken : token;
		return stateFactory(entityID, token);
	}

	dispose(observer) {
		//console.log('+++++++++++++++++++++++++++++++++');
		//console.log(JSON.stringify(this._decodedEntity));
		this._decodedEntity.forEach(typeMap => {
			typeMap.forEach(sirenObservable => {
				//console.log(JSON.stringify(sirenObservable));
				sirenObservable.delete(observer);
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
		//console.log(`onServerResponse: ${JSON.stringify(response)}`);
		if (error) throw new FetchError(error);

		const entity = await SirenParse(response);
		this.setSirenEntity(entity);
	}

	processRawJsonSirenEntity(json, token) {
		token = token === undefined ? this.token.rawToken : token;
		return processRawJsonSirenEntity(json, token);
	}

	push() {
		// should it be async and await for action.push()? SyrenAction class push method id async.
		////console.log('---------------------------------------------------');
		//console.log(`push childstates: ${JSON.stringify(this._childStates())}`);
		this._childStates().forEach(childState => childState.push());
		const actions = this._getMap(this._decodedEntity, observableTypes.action);
		//console.log(`push actions: ${JSON.stringify(actions)}`);
		actions.forEach(action => action.push());
	}

	reset() {
		this._childStates().forEach(childState => childState?.reset());
		this.setSirenEntity();
		const actions = this._getMap(this._decodedEntity, observableTypes.action);
		actions.forEach(action => action.reset());
	}

	setSirenEntity(entity = null) {
		//console.log(`setSirenEntity called with ${JSON.stringify(entity)}`);
		if (entity && entity.href) {
			return;
		}
		this._entity = entity !== null ? entity : this._entity;
		this._decodedEntity.forEach(typeMap => {
			typeMap.forEach(sirenObservable => {
				//console.log(`sirenObservable: ${sirenObservable.constructor.name}, typeMap: ${JSON.stringify(typeMap)}, entity: ${JSON.stringify(this._entity)}`);
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

			const basicInfo = sirenObserverDefinedProperty(propertyInfo); // should it be like in addObservables:  sirenObserverDefinedProperty(propertyInfo, this);
			if (!basicInfo) return;

			const sirenObservable = this._getSirenObservable(basicInfo);
			//console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
			//console.log(basicInfo); // Object{id: undefined, route: undefined, token: undefined, type: 3, state: undefined}
			//console.log(sirenObservable); // SirenClasses{_observers: ObserverMap{_observers: Map{}, _methods: WeakMap{}}}
			//console.log(sirenObservable.value); // undefined
			//console.log(propertyInfo.value); // undefined
			sirenObservable && (sirenObservable.value = propertyInfo.value); // does: x.undefined = y.undefined
		});
	}

	_childStates() {
		let childStates = [];
		this._decodedEntity.forEach(typeMap => {
			typeMap.forEach(sirenObservable => {
				childStates = [...childStates, ...(sirenObservable.childStates || [])];
				//console.log(`%%% _childStates: ${childStates.length}`);
				//console.log(`%%% sirenObservable.childState: ${sirenObservable.childState}`);
				//console.log(`%%% sirenObservable class name: ${sirenObservable.constructor.name}`);
				sirenObservable.childState && childStates.push(sirenObservable.childState);
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

	_getSirenObservable(basicInfo) {
		const typeMap = this._getMap(this._decodedEntity, basicInfo.type);
		if (typeMap.has(basicInfo.id)) return typeMap.get(basicInfo.id);

		const sirenObservable = sirenObservableFactory(basicInfo);
		typeMap.set(basicInfo.id, sirenObservable);
		this._entity && sirenObservable.setSirenEntity(this._entity, typeMap);

		return sirenObservable;
	}
}

export async function processRawJsonSirenEntity(json, rawToken) {
	const entity = await SirenParse(json);
	const entityID = entity.hasLinkByRel && entity.hasLinkByRel('self') && entity.getLinkByRel && entity.getLinkByRel('self').href;
	if (!entityID) return;
	const state = await stateFactory(entityID, rawToken);
	state.setSirenEntity(entity);
}

export async function stateFactory(entityID, rawToken) {
	//console.log('<<<<<<<<<<<<<<<<<<<<<<<<<');
	const token = await getToken(rawToken);
	if (store.has(entityID, token)) {
		const state = store.get(entityID, token);
		return state;
	}
	const state = new HypermediaState(entityID, token);
	store.add(state);
	return state;
}

export function dispose(state, observable) {
	state && state.dispose(observable);
}
