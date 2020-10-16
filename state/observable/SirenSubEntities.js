import { getEntityIdFromSirenEntity } from './Common.js';
import { Observable } from './Observable.js';
import { SirenSubEntity } from './SirenSubEntity.js';

export class SirenSubEntities extends Observable {
	static basicInfo({ token }) {
		return { token };
	}

	constructor({ id, token }) {
		super();
		this._rel = id;
		this._childSubEntities = new Map();
		this._token = token;
		this._entityIds = [];
	}

	get entityIds() {
		return this._entityIds;
	}

	set entityIds(entityIds) {
		if (!this._entityId !== entityIds) {
			this._observers.setProperty(entityIds || []);
		}
		this._entityIds = entityIds || [];
	}

	// TODO: remove in US121366
	addObserver(observer, property, { method }) {
		super.addObserver(observer, property, { method }, this.entityIds);
	}

	get childSubEntities() {
		return this._childSubEntities;
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
			const entityId = getEntityIdFromSirenEntity(sirenSubEntity);
			// If we already set it up why do it again?
			if (this.childSubEntities.has(entityId)) {
				childSubEntities.set(entityId, this.childSubEntities.get(entityId));
				this.childSubEntities.delete(entityId);
				return;
			}

			const subEntity = new SirenSubEntity({ id: this.rel, token: this._token });
			subEntity.entityId = entityId;
			childSubEntities.set(entityId, subEntity);
		});

		// These ones are no longer required.
		this.childSubEntities.clear();

		this._childSubEntities = childSubEntities;

		const entityIds = [];
		this.childSubEntities.forEach((_, entityId) => {
			entityIds.push(entityId);
		});

		this.entityIds = entityIds;
	}
}
