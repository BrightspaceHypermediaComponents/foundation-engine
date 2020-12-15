import { fetch } from '../fetch.js';
import { getEntityIDFromSirenEntity } from './ObserverMap.js';
import { Observable } from './Observable.js';
import { Routable } from './Routable.js';
import { shouldAttachToken } from '../token.js';

/**
 * Observable SirenSubEntity object
 * Reflects back the siren parsed entity to any observers
 */
export class SirenSubEntity extends Routable(Observable) {
	constructor({ id, token, state } = {}) {
		super({});
		this._state = state;
		this._rel = id;
		this._token = token;
	}

	get entity() {
		return this._observers.value;
	}

	/**
	 * @param {Entity} subEntity siren-parser Entity to set to
	 */
	set entity(subEntity) {
		if (this.entity !== subEntity) {
			// todo: remove this when we have the facade for subEntity
			subEntity.href = getEntityIDFromSirenEntity(subEntity);
			this._observers.setProperty(subEntity);
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

		this._observers.merge(entity._observers);
		this._token = this._token || entity._token;
	}

	async _setSubEntity(subEntity) {
		const entityId = getEntityIDFromSirenEntity(subEntity);
		this.entity = subEntity;

		if (this._token) {
			this._routedState = await this.createRoutedState(entityId, shouldAttachToken(this._token.rawToken, subEntity));
			this._routedState.setSirenEntity(subEntity);
			this._routes.forEach((route, observer) => {
				this._routedState.addObservables(observer, route);
			});

			fetch(this._routedState);
		}
	}

}
