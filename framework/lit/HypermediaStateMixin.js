import { dispose, observableTypes as ot, stateFactory } from '../../state/HypermediaState.js';
import { deepCopy } from '../../helper/deepCopy.js';
import { fetch } from '../../state/fetch.js';

export const observableTypes = ot;

/**
 * @export
 * @polymerMixin
 **/
export const HypermediaStateMixin = superclass => class extends superclass {

	static get properties() {
		return {
			/**
			 * Href for the entity
			 */
			href: { type: String, reflect: true },
			/**
			 * Token JWT Token for brightspace | a function that returns a JWT token for brightspace | null (defaults to cookie authentication in a browser)
			 */
			token: { type: String },
			_loaded: { type: Boolean }
		};
	}

	constructor() {
		super();
		this._loaded = false;
		this.__observables = this.constructor.properties;
		this.__waitForAttributes = {};
	}

	connectedCallback() {
		super.connectedCallback();
		if (!this._state && this.__shouldUpdateState()) {
			this._makeState();
		}
	}

	disconnectedCallback() {
		dispose(this._state, this);
		super.disconnectedCallback();
	}

	updated(changedProperties) {
		if (this.__shouldUpdateState(changedProperties)) {
			dispose(this._state, this);
			this._makeState();
		}
		super.updated(changedProperties);
	}

	requiredPropertyForState(property, valuesThatAreFalsy = []) {
		if (!this.__waitForAttributes[property]) {
			this.__waitForAttributes[property] = [];
		}
		this.__waitForAttributes[property] = [...this.__waitForAttributes[property], ...valuesThatAreFalsy];
	}

	__shouldUpdateState(changedProperties = null) {
		const requiredProperties = { ...this.__waitForAttributes, href: ['undefined'], token: [] };
		if (changedProperties !== null) {
			const atLeastOnePropertyIsChanging = Object.keys(requiredProperties).some(property => changedProperties.has(property));
			if (!atLeastOnePropertyIsChanging) return false;
		}

		return !Object.keys(requiredProperties).some(property => {
			const isAFalsyValue = requiredProperties[property].some(value => this[property] === value);
			return (!this[property] && this[property] !== 0 && this[property] !== false) || isAFalsyValue;
		});
	}

	_hasAction(action) {
		return this[action] && this[action].has;
	}

	async _makeState() {
		if (this.__gettingState) return;
		try {
			this.__gettingState = true;
			this._state = await stateFactory(this.href, this.token);
			await this._state.addObservables(this, this._observables);
			fetch(this._state)
				.then(async() => {
					await this.updateComplete;
					await this._state.allFetchesComplete();
					this._loaded = true;
				});

		} catch (error) {
			console.error(error);
		} finally {
			this.__gettingState = false;
		}
	}

	get _observables() {
		return deepCopy(this.__observables);
	}

};
