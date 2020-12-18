import { fetch } from '../fetch.js';
import { getEntityIDFromSirenEntity } from './ObserverMap.js';
import { Routable } from './Routable.js';
import { shouldAttachToken } from '../token.js';
import { SirenAction } from './SirenAction.js';

const defaultSummon = { has: false, summon: () => undefined };

export class SirenSummonAction extends Routable(SirenAction) {

	constructor({ id: name, token, state, prime }) {
		super({ id: name, token, state });
		this._prime = prime;
		this.action = defaultSummon;
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
		const sirenEntity = super.onServerResponse(json, error);

		const entityID = getEntityIDFromSirenEntity(sirenEntity);
		this.routedState = await this.createRoutedState(entityID, shouldAttachToken(this._token.rawToken, sirenEntity));
		this._routes.forEach((route, observer) => {
			this.routedState.addObservables(observer, route);
		});

		this.routedState.setSirenEntity(sirenEntity);

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
		if (this._routes.size > 0) {
			fetch(this);
		}
		this._updateAction();
	}

	// async summon() {
	// 	// TODO: return SirenFacade when it exists
	// 	const entity = await fetch(this);
	// 	return entity;
	// }

	_updateAction() {
		this.action = {
			has: true,
			summon: (observables) => {
				this._prepareAction(observables);
				this._readyToSend = true;
				return fetch(this);
			}
		};
	}
}
