import { Observable } from './Observable.js';

export class SirenClasses extends Observable {
	get value() {
		return this._value;
	}

	set value(value) {
		if (!this._value !== value) {
			this._observers.setProperty(value);
		}
		this._value = value;
	}

	// TODO: remove in future
	addObserver(observer, property, { method }) {
		super.addObserver(observer, property, { method }, this._value);
	}

	setSirenEntity(sirenEntity) {
		this.value = sirenEntity && sirenEntity['class'];
	}
}
