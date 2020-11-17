import { Observable } from './Observable.js';

export class SirenProperty extends Observable {
	static definedProperty({ id, name, observable }) {
		id = id || name.replace(/^_+/, '');
		return { id, type: observable };
	}

	constructor({ id }) {
		super();
		this._property = id;
	}

	get value() {
		return this._observers.value;
	}

	set value(value) {
		if (!this.value !== value) {
			this._observers.setProperty(value);
		}
	}

	get property() {
		return this._property;
	}

	setSirenEntity(sirenEntity) {
		this.value = sirenEntity && sirenEntity.properties && sirenEntity.properties[this.property];
	}
}
