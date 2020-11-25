import { fetch } from '../fetch.js';
import { getEntityIDFromSirenEntity } from './ObserverMap.js';
import { Observable } from './Observable.js';
import { shouldAttachToken } from '../token.js';

export class SirenSubEntity extends Observable {
	constructor({ id, token, state } = {}) {
		super();
		this._state = state;
		this._rel = id;
		this._routes = new Map();
		this._token = token;
	}

	get entityID() {
		return this._observers.value;
	}

	set entityID(entityID) {
		if (this.entityID !== entityID) {
			this._observers.setProperty(entityID);
		}
	}

	// TODO: remove in US121366?
	addObserver(observer, property, { route, method }  = {}) {
		if (route) {
			this._addRoute(observer, route);
		} else {
			super.addObserver(observer, property, { method });
		}
	}

	get childState() {
		return this._childState;
	}

	deleteObserver(observer) {
		if (this._route.has(observer)) {
			this._deleteRoute(observer);
		} else {
			super.deleteObserver(observer);
		}
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

	_merge(entity) {
		if (!entity || !(entity instanceof SirenSubEntity)) {
			return;
		}

		entity._observers._observers.forEach((observer, property) => {
			this.addObserver(observer, property);
		});

		this._token = this._token || entity._token;
	}

	async _setSubEntity(subEntity) {
		this.entityID = getEntityIDFromSirenEntity(subEntity);

		if (this._token) {
			this._childState = await this.createChildState(this.entityID, shouldAttachToken(this._token.rawToken, subEntity));
			this._childState.setSirenEntity(subEntity);
			this._routes.forEach((route, observer) => {
				this._childState.addObservables(observer, route);
			});

			fetch(this._childState);
		}
	}

}
