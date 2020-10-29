import { Fetchable } from '../Fetchable.js';
import { Observable } from './Observable.js';
import { performAction } from '../store.js';

export class SirenAction extends Fetchable(Observable) {
	constructor({ id: name, token, state }) {
		super(null, token);
		this._action = { has: false, perform: () => undefined, update: () => undefined };
		this._name = name;
		this._state = state;
	}

	get action() {
		return this._observers.value || { has: false, perform: () => undefined, update: () => undefined };
	}

	set action({ has, perform, update }) {
		if (!has || typeof perform !== 'function') {
			perform = () => undefined;
			update = () => undefined;
		}
		if (this.action().has !== has || this.action().perform !== perform) {
			this._observers.setProperty({ has, perform, update });
		}

		this._action = { has, perform, update };
	}

	// TODO: remove in US121366
	addObserver(observer, property, { method }) {
		super.addObserver(observer, property, method, this.action);
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

	setBodyFromInput(input) {
		if (this._rawSirenAction.type.indexOf('json') !== -1) {
			this._body = JSON.stringify({ ...this._fields, ...input });
		} else if (this.method !== 'GET' && this.method !== 'HEAD') {
			const formData = new FormData();
			const fields = { ...this._fields, ...input };
			Object.keys(fields).forEach((name) => formData.append(name, fields[name]));
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

		this.action = {
			has: true,
			perform: (params) => {
				return performAction(this, params);
			},
			update: (observables) => {
				return this._state.updateProperties(observables);
			}
		};
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
}
