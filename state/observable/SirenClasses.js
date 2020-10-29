import { Observable } from './Observable.js';

export class SirenClasses extends Observable {
	get value() {
		return this._observers.value;
	}

	set value(value) {
		this.setValue(!this.value(), value);
	}

	// TODO: remove in future
	addObserver(observer, property, { method }) {
		super.addObserver(observer, property, method, this._value);
	}

	setSirenEntity(sirenEntity) {
		this.value = sirenEntity && sirenEntity['class'];
	}
}
