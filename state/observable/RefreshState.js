import { fetch } from '../fetch.js';
import { Observable } from './Observable.js';

export class RefreshState extends Observable {
	static definedProperty({ state }) {
		return { id: 'refetchState', state };
	}
	constructor({ state }) {
		super();
		this._observers.setProperty(() => fetch(state, true));
	}
}
