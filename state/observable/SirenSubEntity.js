import { fetch } from '../fetch.js';
import { getEntityIDFromSirenEntity } from './ObserverMap.js';
import { Observable } from './Observable.js';
import { Routable } from './Routable.js';
import { shouldAttachToken } from '../token.js';
import { SirenFacade } from './SirenFacade.js';

/**
 * Observable SirenSubEntity object
 * Reflects back a SirenFacade to any observers
 */
export class SirenSubEntity extends Routable(Observable) {
	constructor({ id, token, state, verbose } = {}) {
		super({});
		this._state = state;
		this._rel = id;
		this._token = token;
		this._verbose = verbose;
	}

	get entity() {
		return this._observers.value;
	}

	/**
	 * Mutates a given siren-parser Entity object to a SirenFacade before setting
	 * the observed property
	 * @param {Entity} subEntity - the siren-parser entity to set
	 */
	set entity(subEntity) {
		const facade = new SirenFacade(subEntity, this._verbose);
		if (this.entity !== facade) {
			this._observers.setProperty(facade);
		}
	}

	get rel() {
		return this._rel;
	}

	setSirenEntity(sirenEntity, SubEntityCollectionMap) {
		const parsedSirenEntity = sirenEntity && sirenEntity.hasSubEntityByRel(this._rel) && sirenEntity.getSubEntityByRel(this._rel);
		if (!parsedSirenEntity) return;

		if (SubEntityCollectionMap && SubEntityCollectionMap instanceof Map) {
			parsedSirenEntity.rel.forEach(rel => {
				if (SubEntityCollectionMap.has(rel)) {
					this._merge(SubEntityCollectionMap.get(rel));
				}
				SubEntityCollectionMap.set(rel, this);
			});
		}

		this._setSubEntity(parsedSirenEntity);
	}

	/**
	 *
	 * @param {SirenSubEntity} sirenSubEntity - the observable object to merge
	 */
	_merge(sirenSubEntity) {
		if (!sirenSubEntity || !(sirenSubEntity instanceof SirenSubEntity)) {
			return;
		}

		this._observers.merge(sirenSubEntity._observers);
		this._token = this._token || sirenSubEntity._token;
	}

	async _setSubEntity(subEntity) {
		const entityID = getEntityIDFromSirenEntity(subEntity);
		this.entity = subEntity;

		if (this._token) {
			this._routedState = await this.createRoutedState(entityID, shouldAttachToken(this._token.rawToken, subEntity));
			this._routedState.setSirenEntity(subEntity);
			this._routes.forEach((route, observer) => {
				this._routedState.addObservables(observer, route);
			});

			fetch(this._routedState);
		}
	}

}
