import { Observable } from './Observable.js';

export class SirenProperty extends Observable {
	static basicInfo({ id, name, observable }) {
		id = id || name.replace(/^_+/, '');
		return { id, type: observable };
	}

	constructor({ id }) {
		super();
		this._property = id;
	}

	get value() {
		return this._value;
	}

	set value(value) {
		if (!this._value !== value) {
			this._observers.setProperty(value);
		}
		this._value = value;

	}

	addObserver(observer, property, { method }) {
		super.addObserver(observer, property, method, this.value);
	}

	get property() {
		return this._property;
	}

	setSirenEntity(sirenEntity) {
		this.value = sirenEntity && sirenEntity.properties && sirenEntity.properties[this.property];
	}
}
