import { Observable } from './Observable.js';

export class SirenEntity extends Observable {

	get sirenEntity() {
		return this._observers.value;
	}

	set sirenEntity(sirenEntity) {
		this.setValue(!this.sirenEntity(), sirenEntity);
	}

	// TODO: remove in US121366
	addObserver(observer, property, { method }) {
		super.addObserver(observer, property, method, this.sirenEntity);
	}

	setSirenEntity(sirenEntity) {
		this.sirenEntity = sirenEntity;
	}
}
