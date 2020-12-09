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

	onServerResponse(json, error) {
		if (error) {
			throw new FetchError(error);
		}
		if (!json) {
			return;
		}

		return this._state.processRawJsonSirenEntity(json);
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

	setBodyFromInput(input) {
		if (this._rawSirenAction.type.indexOf('json') !== -1) {
			this._body = JSON.stringify({ ...this._fields, ...input });
		} else if (this.method !== 'GET' && this.method !== 'HEAD') {
			const formData = new FormData();
			const fields = { ...this._fields, ...input };
			Object.keys(fields).forEach((name) => {
				formData.append(name, fields[name]);
			});
			this._body = formData;
		}
		return this._body;
	}

	setQueryParams(input) {
		if (this.method === 'GET' || this.method === 'HEAD') {
			super.setQueryParams({ ...this._fields, ...input });
		}

		return this.href;
	}

	setSirenEntity(sirenEntity) {
		if (!sirenEntity || !sirenEntity.hasActionByName(this._name)) {
			this.action = { has: false };
			return;
		}

		this._rawSirenAction = sirenEntity.getActionByName(this._name);
		this._href = this._rawSirenAction.href;
		this._fields = this._decodeFields(this._rawSirenAction);

		this._updateAction();
	}

	// Doesn't support field names with the same name.
	// todo: add support for array fields
	// todo: change to getQueryParams
	_decodeFields(action) {
		const url = new URL(action.href, window.location.origin);
		const fields = {};
		if (action.method === 'GET' || action.method === 'HEAD') {
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
		Object.keys(observables).forEach(field => input[field] = observables[field]?.value ? observables[field].value : observables[field]);
		this.setQueryParams(input);
		this.setBodyFromInput(input);
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
