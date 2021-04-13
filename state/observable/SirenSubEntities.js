import { getEntityIDFromSirenEntity } from './ObserverMap.js';
import { Observable } from './Observable.js';
import { SirenFacade } from './SirenFacade.js';
import { SirenSubEntity } from './SirenSubEntity.js';

/**
 * Observable SirenSubEntities
 * Reflects back an array of SirenFacades to any observers
 */
export class SirenSubEntities extends Observable {

	static definedProperty({ token, verbose }) {
		return { token, verbose };
	}

	constructor({ id, token, state, verbose }) {
		super();
		this._state = state;
		this._rel = id;
		this._entityMap = new Map();
		this._token = token;
		this._verbose = verbose;
	}

	/**
	 * @return { Array<SirenFacade> }
	 */
	get entities() {
		return this._observers.value || [];
	}

	/**
	 * @param { Array<SirenFacade> } sirenFacades - List of SirenFacade objects
	 */
	set entities(sirenFacades) {
		if (this.entities !== sirenFacades) {
			this._observers.setProperty(sirenFacades || []);
		}
	}

	get entityMap() {
		return this._entityMap;
	}

	get rel() {
		return this._rel;
	}

	get routedState() {
		const routedStates = [];
		this.entityMap.forEach(subEntity => subEntity.routedState && routedStates.push(subEntity.routedState));
		return routedStates;
	}

	async setSirenEntity(sirenParsedEntity) {
		const subEntities = sirenParsedEntity && sirenParsedEntity.getSubEntitiesByRel(this._rel);
		const entityMap = new Map();
		const sirenFacades = [];

		// This makes the assumption that the order returned by the collection
		// matches the prev/next order for each item.
		// As of writting this making this assumption makes sense for all cases.
		// If we find a case where that assumption is bad.
		// There is a way to build a list from next/prev that is performant
		// and will change based on the individual item update.
		const promises = subEntities.map(async(sirenSubEntity) => {
			const entityID = getEntityIDFromSirenEntity(sirenSubEntity);
			sirenFacades.push(new SirenFacade(sirenSubEntity, this._verbose));
			let subEntity;
			// If we already set it up why do it again?
			if (entityID && this.entityMap.has(entityID)) {
				subEntity = this.entityMap.get(entityID);
			} else {
				subEntity = new SirenSubEntity({ id: this.rel, token: this._token, verbose: this._verbose, state: this._state });
				await subEntity.setSubEntity(sirenSubEntity);
				entityMap.set(entityID, subEntity);
			}
		});
		await Promise.all(promises);

		// Clear the old entity map and reset it to the new one
		this.entityMap.clear();
		this._entityMap = entityMap;

		this.entities = sirenFacades;
	}
}
