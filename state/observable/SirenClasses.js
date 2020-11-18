import { Observable } from './Observable.js';

export class SirenClasses extends Observable {
	get classes() {
		return this._observers.value;
	}

	set classes(value) {
		if (this.classes !== value) {
			this._observers.setProperty(value);
		}
	}

	setSirenEntity(sirenEntity) {
		this.classes = sirenEntity && sirenEntity['class'];
	}
}
