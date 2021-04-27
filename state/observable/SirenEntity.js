import { Observable } from './Observable.js';

export class SirenEntity extends Observable {

	get sirenEntity() {
		return this._observers.value;
	}

	set sirenEntity(sirenEntity) {
		if (this.sirenEntity !== sirenEntity) {
			this._observers.setProperty(sirenEntity);
		}
	}

	async setSirenEntity(sirenEntity) {
		this.sirenEntity = sirenEntity;
	}
}
