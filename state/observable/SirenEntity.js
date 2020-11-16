import { Observable } from './Observable.js';

export class SirenEntity extends Observable {

	get sirenEntity() {
		return this._observers.value;
	}

	set sirenEntity(sirenEntity) {
		if (!this.sirenEntity() !== sirenEntity) {
			this._observers.setProperty(sirenEntity);
		}
	}

	// TODO: remove in US121366
	addObserver(observer, property, { method }) {
		super.addObserver(observer, property, method);
	}

	setSirenEntity(sirenEntity) {
		this.sirenEntity = sirenEntity;
	}
}
