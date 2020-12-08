import { Routable } from 'Routable.js';
import { SirenAction } from 'SirenAction.js';

export class SirenSummonAction extends Routable(SirenAction) {
	constructor({ id: name, token, state, prime }) {
		super({ name, token, state });
		this._prime = prime;
	}

	set action({ has, prime, summon }) {
		if (!has || typeof summon !== 'function') {
			summon = () => undefined;
		}
		if (this.action.has !== has || this.action.summon !== summon || this.action.prime !== prime) {
			this._observers.setProperty({ has, prime, summon });
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
			prime: this._prime,
			has: true,
			summon: (observables) => {
				this._prepareAction(observables);
				this._readyToSend = true;
				return this._state.updateProperties(observables);
			}
		};
	}
}
