import { Routable } from './Routable.js';
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
			summon = () => undefined;
		}
		if (this.action.has !== has || this.action.summon !== summon) {
			this._observers.setProperty({ has, summon });
		}
	}

	onServerResponse(json, error) {
		const entity = super.onServerResponse(json, error);
		this.setSirenEntity(entity);
	}

	// overriding superclass push method to do nothing
	push() {}

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
