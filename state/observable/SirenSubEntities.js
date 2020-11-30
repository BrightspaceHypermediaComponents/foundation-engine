import { getEntityIDFromSirenEntity } from './ObserverMap.js';
import { Observable } from './Observable.js';
import { SirenSubEntity } from './SirenSubEntity.js';

export class SirenSubEntities extends Observable {
	static definedProperty({ token }) {
		return { token };
	}

	constructor({ id, token, state } = {}) {
		super();
		this._state = state;
		this._rel = id;
		this._childSubEntities = new Map();
		this._token = token;
		this.entityIDs = [];
	}

	get entityIDs() {
		return this._observers.value;
	}

	set entityIDs(entityIDs) {
		if (this.entityIDs !== entityIDs) {
			this._observers.setProperty(entityIDs || []);
		}
	}

	get childSubEntities() {
		return this._childSubEntities;
	}

	get rel() {
		return this._rel;
	}

	setSirenEntity(sirenEntity) {
		const subEntities = sirenEntity && sirenEntity.getSubEntitiesByRel(this._rel);
		const childSubEntities = new Map();

		// This makes the assumption that the order returned by the collection
		// matches the prev/next order for each item.
		// As of writting this making this assumption makes sense for all cases.
		// If we find a case where that assumption is bad.
		// There is a way to build a list from next/prev that is performant
		// and will change based on the individual item update.
		subEntities.forEach((sirenSubEntity) => {
			const entityID = getEntityIDFromSirenEntity(sirenSubEntity);
			// If we already set it up why do it again?
			if (this.childSubEntities.has(entityID)) {
				childSubEntities.set(entityID, this.childSubEntities.get(entityID));
				this.childSubEntities.delete(entityID);
				return;
			}

			const subEntity = new SirenSubEntity({ id: this.rel, token: this._token });
			subEntity.entityID = entityID;
			childSubEntities.set(entityID, subEntity);
		});

		// These ones are no longer required.
		this.childSubEntities.clear();

		this._childSubEntities = childSubEntities;

		const entityIDs = [];
		this.childSubEntities.forEach((_, entityID) => {
			entityIDs.push(entityID);
		});

		this.entityIDs = entityIDs;
	}
}
