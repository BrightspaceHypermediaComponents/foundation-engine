import { getEntityIDFromSirenEntity } from './ObserverMap.js';
import { Observable } from './Observable.js';
import { SirenSubEntity } from './SirenSubEntity.js';

/**
 * Observable SirenSubEntities
 * Reflects back an array of parsed siren entities to any observers
 */
export class SirenSubEntities extends Observable {
	static definedProperty({ token }) {
		return { token };
	}

	constructor({ id, token, state }) {
		super();
		this._state = state;
		this._rel = id;
		this._entityMap = new Map();
		this._token = token;
		this.entities = [];
	}

	get entities() {
		return this._observers.value;
	}

	set entities(entities) {
		if (this.entities !== entities) {
			this._observers.setProperty(entities || []);
		}
	}

	get entityMap() {
		return this._entityMap;
	}

	get rel() {
		return this._rel;
	}

	setSirenEntity(sirenEntity) {
		const subEntities = sirenEntity && sirenEntity.getSubEntitiesByRel(this._rel);
		const entityMap = new Map();
		const entities = [];

		// This makes the assumption that the order returned by the collection
		// matches the prev/next order for each item.
		// As of writting this making this assumption makes sense for all cases.
		// If we find a case where that assumption is bad.
		// There is a way to build a list from next/prev that is performant
		// and will change based on the individual item update.
		subEntities.forEach((sirenSubEntity) => {
			const entityID = getEntityIDFromSirenEntity(sirenSubEntity);
			let subEntity;
			// If we already set it up why do it again?
			if (this.entityMap.has(entityID)) {
				subEntity = this.entityMap.get(entityID);
			} else {
				// todo: create a facade to make the subEntity easier to work with
				subEntity = new SirenSubEntity({ id: this.rel, token: this._token });
				subEntity.entity = sirenSubEntity;
			}
			entityMap.set(entityID, subEntity);
			entities.push(subEntity.entity);
		});

		// Clear the old entity map and reset it to the new one
		this.entityMap.clear();
		this._entityMap = entityMap;

		this.entities = entities;
	}
}
