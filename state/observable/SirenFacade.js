import { getEntityIDFromSirenEntity } from './ObserverMap.js';
/**
 * A class to transform parsed siren entities into easy to use
 * objects to be reflected and worked with in foundation components.
 */
export class SirenFacade {
	/**
	 * Creates the facade from a parsed entity
	 * @param {Entity} sirenParsedEntity - The raw entity as it has been parsed by SirenParser
	 * @param {Boolean} verbose - Whether to return more or less information
	 */
	constructor(sirenParsedEntity, verbose = false) {
		if (!sirenParsedEntity) return;

		this.href = getEntityIDFromSirenEntity(sirenParsedEntity) || undefined;
		this.rel = sirenParsedEntity.rel || [];
		this.class = sirenParsedEntity.class || [];
		this.links = sirenParsedEntity.links || [];
		// todo: We should figure out how we want to do actions - this is just a list of names
		this.actions = sirenParsedEntity.actions ? sirenParsedEntity.actions.map(x => x.name) : [];
		// todo: sub entities only go one level currently
		this.entities = sirenParsedEntity.entities ? sirenParsedEntity.entities.map(x => new SirenFacade(x, verbose)) : [];
		this.properties = sirenParsedEntity.properties || {};
		if (verbose) {
			this.rawSirenParsedEntity = sirenParsedEntity;
		}
	}

	/**
	 * Checks if the class name exists on the entity or not
	 * @param {String} className - Class name to check
	 * @returns {Boolean}
	 */
	hasClass(className) {
		return !!(this.class.length && this.class.includes(className));
	}
}
