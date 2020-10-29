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
		this.setValue(!this.value, value);
	}

	// TODO: remove in US121366
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
