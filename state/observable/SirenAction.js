import { Fetchable, FetchError } from '../Fetchable.js';
import { fetch } from '../fetch.js';
import { Observable } from './Observable.js';

const defaultAction = { has: false, commit: () => undefined };

export class SirenAction extends Fetchable(Observable) {
	static definedProperty({ name: id, token }) {
		return { id, token };
	}

	constructor({ id: name, token, state }) {
		super(null, token);
		this.action = defaultAction;
		this._name = name;
		this._readyToSend = false;
		this._state = state;
	}

	get action() {
		return this._observers.value || defaultAction;
	}

	set action({ has, commit }) {
		if (!has || typeof commit !== 'function') {
			has = false;
			commit = () => undefined;
		}
		if (this.action.has !== has || this.action.commit !== commit) {
			this._observers.setProperty({ has, commit });
		}
	}

	get headers() {
		super.headers;
		// set header content to json if present
		if (this._rawSirenAction.type.indexOf('json') !== -1) {
			this._headers.set('Content-Type', this._rawSirenAction.type);
		}
		return this._headers;
	}

	get method() {
		return this._rawSirenAction && this._rawSirenAction.method;
	}

	async onServerResponse(json, error) {
		if (error) {
			throw new FetchError(error);
		}
		if (!json) {
			return null;
		}

		const entity = await this._state.processRawJsonSirenEntity(json);
		if (this._state.isSelfless && !entity.hasLinkByRel('self')) {
			this._state.setSirenEntity(entity);
		}

		return entity;
	}

	async push() {
		if (this._readyToSend) {
			await fetch(this);
			this.reset();
		}
	}

	reset() {
		this._href = this._rawSirenAction.href;
		this._body = null;
		this._readyToSend = false;
	}

	/**
	 * Sets the body of the request from the given input along with the other fields
	 * Supports array inputs - will unpack the array into separate field entries
	 * @param {Object} input - The inputs to commit
	 * @return {FormData} The prepared body
	 */
	setBodyFromInput(input) {
		if (this._rawSirenAction.type.indexOf('json') !== -1) {
			this._body = JSON.stringify({ ...this._fields, ...input });
		} else if (this.method !== 'GET' && this.method !== 'HEAD') {
			const formData = new FormData();
			const fields = { ...this._fields, ...input };
			Object.keys(fields).forEach((name) => {
				if (Array.isArray(fields[name])) {
					// unpack the array and append each entry
					fields[name].forEach(input => formData.append(name, input));
				} else {
					formData.append(name, fields[name]);
				}
			});
			this._body = formData;
		}
		return this._body;
	}

	setQueryParams(input) {
		if (this.method === 'GET' || this.method === 'HEAD') {
			super.setQueryParams(input);
		}
	}

	setSirenEntity(sirenEntity) {
		if (!sirenEntity || !sirenEntity.hasActionByName(this._name)) {
			this.action = { has: false };
			return;
		}
		this._rawSirenAction = sirenEntity.getActionByName(this._name);
		this._href = this._rawSirenAction.href;
		this._fields = this._decodeFields(this._rawSirenAction);
		this._method = this._rawSirenAction.method;

		this._updateAction();
	}

	/**
	 * Decodes the query parameters and fields for the action
	 * Doesn't support fields with the same name - use an array for input in these cases
	 * @param {Object} action - The raw action parsed from siren-parser
	 * @returns {Object} Fields object
	 */
	_decodeFields(action) {
		const url = new URL(action.href, window.location.origin);
		const fields = {};
		if (url.searchParams.toString() && (action.method === 'GET' || action.method === 'HEAD')) {
			for (const param in url.searchParams.entries()) {
				fields[param[0]] = param[1];
			}
		}
		if (action.fields && action.fields.forEach) {
			action.fields.forEach((field) => {
				if (field.value === undefined) {
					return;
				}

				fields[field.name] = field.value;
			});
		}
		return fields;
	}

	_prepareAction(observables) {
		const input = {};
		if (observables) {
			Object.keys(observables).forEach((field) => {
				input[field] = observables[field]?.value !== undefined ? observables[field].value : observables[field];
			});
		}
		this.setQueryParams(input);
		this.setBodyFromInput(input);
	}

	_setupHrefWithQueryParams(paramsObj) {
		return super._setupHrefWithQueryParams({ ...this._fields, ...paramsObj });
	}

	_updateAction() {
		this.action = {
			has: true,
			commit: (observables) => {
				this._prepareAction(observables);
				this._readyToSend = true;
				return this._state.updateProperties(observables);
			}
		};
	}
}
