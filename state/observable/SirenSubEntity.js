import { fetch, stateFactoryByRawSirenEntity } from '../../state/store.js';
import { getEntityIdFromSirenEntity } from './Common.js';
import { Observable } from './Observable.js';

export class SirenSubEntity extends Observable {
	constructor({ id, token }) {
		super();
		this._rel = id;
		this._routes = new Map();
		this._token = token;
	}

	get entityId() {
		return this._observers.value;
	}

	set entityId(entityId) {
		this.setValue(!this.entityId, entityId);
	}

	// TODO: remove in US121366?
	addObserver(observer, property, { route, method }) {
		if (route) {
			this._addRoute(observer, route);
		} else {
			super.addObserver(observer, property, { method }, this.entityId);
		}
	}

	get childState() {
		return this._childState;
	}

	get rel() {
		return this._rel;
	}

	setSirenEntity(sirenEntity, SubEntityCollectionMap) {
		const subEntity = sirenEntity && sirenEntity.hasSubEntityByRel(this._rel) && sirenEntity.getSubEntityByRel(this._rel);
		if (!subEntity) return;

		if (SubEntityCollectionMap && SubEntityCollectionMap instanceof Map) {
			subEntity.rel.forEach(rel => {
				if (SubEntityCollectionMap.has(rel)) {
					this._merge(SubEntityCollectionMap.get(rel));
				}
				SubEntityCollectionMap.set(rel, this);
			});
		}

		this._setSubEntity(subEntity);
	}

	_merge(sirenLink) {
		if (!sirenLink || !(sirenLink instanceof SirenSubEntity)) {
			return;
		}

		sirenLink._observers.observers.forEach((observer, property) => {
			this.addObserver(observer, property);
		});

		this._token = this._token || sirenLink._token;
	}

	async _setSubEntity(subEntity) {
		this.entityId = getEntityIdFromSirenEntity(subEntity);

		if (this._token) {
			this._childState = await stateFactoryByRawSirenEntity(subEntity, this._token);
			this._routes.forEach((route, observer) => {
				this._childState.addObservables(observer, route);
			});
			fetch(this._childState);
		}
	}

}
