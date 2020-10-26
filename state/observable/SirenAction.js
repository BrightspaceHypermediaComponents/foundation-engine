import { Observable } from './Observable.js';
import { performAction } from '../store.js';
import { refreshToken } from '../token.js';

export class SirenAction extends Observable {
	constructor({ id: name, token, state }) {
		super();
		this._name = name;
		this._token = token;
		this._state = state;
	}

	get action() {
		return this._components.value || { has: false, perform: () => undefined, update: () => undefined };
	}

	set action({ has, perform, update }) {
		if (!has || typeof perform !== 'function') {
			perform = () => undefined;
			update = () => undefined;
		}
		if (this.action().has !== has || this.action().perform !== perform) {
			this._components.setProperty({ has, perform, update });
		}
	}

	// TODO: remove in US121366
	addObserver(component, property, { method }) {
		super.addObserver(component, property, method, this.action);
	}

	body(input) {
		if (this._rawSirenAction.type.indexOf('json') !== -1) {
			return JSON.stringify({ ...this._fields, ...input });
		} else if (this._rawSirenAction.method !== 'GET' && this._rawSirenAction.method !== 'HEAD') {
			const formData = new FormData();
			const fields = { ...this._fields, ...input };
			Object.keys(fields).forEach((name) => formData.append(name, fields[name]));
			return formData;
		}
	}

	header() {
		const headers = new Headers();
		if (this._rawSirenAction.type.indexOf('json') !== -1) {
			headers.set('Content-Type', this._rawSirenAction.type);
		}

		return headers;
	}

	href(input) {
		let url = new URL(this._rawSirenAction.href, window.location.origin);
		if (this._rawSirenAction.method === 'GET' || this._rawSirenAction.method === 'HEAD') {
			const fields = { ...this._fields, ...input };
			const params = new URLSearchParams(Object.keys(fields).map((name) => [name, fields[name]]));
			url = new URL(`${url.pathname}?${params.toString()}`, url.origin);
		}

		return url.toString();
	}

	get method() {
		return this._rawSirenAction && this._rawSirenAction.method;
	}

	refreshToken() {
		return refreshToken(this.token);
	}

	setSirenEntity(sirenEntity) {
		if (!sirenEntity || !sirenEntity.hasActionByName(this._name)) {
			this.action = { has: false };
			return;
		}

		this._rawSirenAction = sirenEntity.getActionByName(this._name);
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

	get token() {
		return this._token;
	}

	// Doesn't support field names with the same name.
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
