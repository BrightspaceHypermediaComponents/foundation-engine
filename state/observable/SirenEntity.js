import { Observable } from './Observable.js';

export class SirenEntity extends Observable {

	get sirenEntity() {
		return this._sirenEntity;
	}

	set sirenEntity(sirenEntity) {
		if (!this._sirenEntity !== sirenEntity) {
			this._observers.setProperty(sirenEntity);
		}
		this._sirenEntity = sirenEntity;
	}

	// TODO: remove in US121366
	addObserver(observer, property, { method }) {
		super.addObserver(observer, property, method, this.sirenEntity);
	}

	setSirenEntity(sirenEntity) {
		this.sirenEntity = sirenEntity;
	}
}
