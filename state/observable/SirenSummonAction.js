import { fetch } from '../fetch.js';
import { getEntityIDFromSirenEntity } from './ObserverMap.js';
import { Routable } from './Routable.js';
import { SirenAction } from './SirenAction.js';
import { SirenFacade } from './SirenFacade.js';

const defaultSummon = { has: false, summon: () => undefined };

/**
 * Observable that uses an action to summon another entity
 */
export class SirenSummonAction extends Routable(SirenAction) {

	/**
	 * The name is the identifier of the summon action
	 */
	static definedProperty({ name: id, token, verbose }) {
		return { id, token, verbose };
	}

	/**
	 * @param {Object} obj
	 * @param {String} obj.id - The name of the action
	 * @param {Token} obj.token - JWT token
	 * @param {HypermediaState} obj.state
	 * @param {Boolean} obj.verbose - Whether to attach the raw entity on summon
	 * @param {Boolean} obj.prime - Whether to immediately summon the object/prime the cache
	 */
	constructor({ id: name, token, state, verbose, prime }) {
		super({ id: name, token, state });
		this._prime = prime;
		this.action = defaultSummon;
		this._verbose = verbose;
	}

	get action() {
		return this._observers.value || defaultSummon;
	}

	set action({ has, summon }) {
		if (!has || typeof summon !== 'function') {
			has = false;
			summon = () => undefined;
		}
		if (this.action.has !== has || this.action.summon !== summon) {
			this._observers.setProperty({ has, summon });
		}
	}

	async onServerResponse(json, error) {
		const sirenEntity = await super.onServerResponse(json, error);

		const entityID = getEntityIDFromSirenEntity(sirenEntity);
		this.routedState = this.routedState || await this.createRoutedState(entityID, this._token.rawToken);
		this._routes.forEach((route, observer) => {
			this.routedState.addObservables(observer, route);
		});
		await this.routedState.setSirenEntity(sirenEntity);
		return sirenEntity;
	}

	// overriding superclass push method to do nothing
	push() {}

	async setSirenEntity(entity) {
		if (!entity || !entity.hasActionByName(this._name)) {
			this.action = { has: false };
			return;
		}

		this._rawSirenAction = entity.getActionByName(this._name);
		this._href = this._rawSirenAction.href;
		this._fields = this._decodeFields(this._rawSirenAction);
		this._method = this._rawSirenAction.method;
		if (this._routes.size > 0) {
			fetch(this);
		}
		this._updateAction();
	}

	_updateAction() {
		this.action = {
			has: true,
			summon: async(observables) => {
				this._prepareAction(observables);
				this._readyToSend = true;
				// todo: we should be able to just return what we get back from fetch, but it is returning the json
				await fetch(this);
				return new SirenFacade(this.routedState._entity, this._verbose);
			}
		};
	}
}
