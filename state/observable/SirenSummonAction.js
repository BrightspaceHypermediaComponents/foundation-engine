import { fetch } from '../fetch.js';
import { Routable } from './Routable.js';
import { SirenAction } from './SirenAction.js';
import SirenParse from 'siren-parser';

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

	onServerResponse(json, error) {
		super.onServerResponse(json, error);
		const entity = this._state.processRawJsonSirenEntity(json);

		this.setSirenEntity(entity);
		return entity;
	}

	// overriding superclass push method to do nothing
	push() {}

	async summon() {
		// TODO: return SirenFacade when it exists
		const response = fetch(this);
		const entity = await SirenParse(response);
		this.setSirenEntity(entity);
		return entity;
	}

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
