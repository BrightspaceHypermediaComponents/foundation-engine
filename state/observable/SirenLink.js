import { fetch } from '../fetch.js';
import { Observable } from './Observable.js';
import { shouldAttachToken } from '../token.js';
import { stateFactory } from '../HypermediaState.js';

export class SirenLink extends Observable {
	constructor({ id, token, state } = {}) {
		super();
		this._state = state;
		this._rel = id;
		this._routes = new Map();
		this._token = token;
	}

	get href() {
		return this._observers.value;
	}

	set href(href) {
<<<<<<< HEAD
		if (!this.href !== href) {
=======
		if (this.href !== href) {
>>>>>>> 6a2506638eec0d7a49c0f577fd7e6b34e9c83d29
			this._observers.setProperty(href);
		}
	}

<<<<<<< HEAD
	// TODO: remove in US121366
=======
>>>>>>> 6a2506638eec0d7a49c0f577fd7e6b34e9c83d29
	addObserver(observer, property, { route, method } = {}) {
		if (route) {
			this._addRoute(observer, route);
		} else {
			super.addObserver(observer, property, { method });
		}
	}

	get childState() {
		return this._childState;
	}

	deleteObserver(observer) {
		if (this._routes.has(observer)) {
			this._deleteRoute(observer);
		} else {
			super.deleteObserver(observer);
		}
	}

	get rel() {
		return this._rel;
	}

	async setSirenEntity(sirenEntity, linkCollectionMap) {
		const link = sirenEntity && sirenEntity.hasLinkByRel(this.rel) && sirenEntity.getLinkByRel(this.rel);
		if (!link) return;

		this.href = link.href;

		if (linkCollectionMap && linkCollectionMap instanceof Map) {
			link.rel.forEach(rel => {
				if (linkCollectionMap.has(rel) && this !== linkCollectionMap.get(rel)) {
					this._merge(linkCollectionMap.get(rel));
				}
				linkCollectionMap.set(rel, this);
			});
		}

		if (this._token) {
			this._childState = await this.createChildState(link.href, shouldAttachToken(this._token.rawToken, link));
			this._routes.forEach((route, observer) => {
				this._childState.addObservables(observer, route);
			});

			fetch(this._childState);
		}
	}

	_merge(sirenLink) {
		if (!sirenLink || !(sirenLink instanceof SirenLink)) {
			return;
		}

		sirenLink._observers._observers.forEach((observer, property) => {
			this.addObserver(observer, property);
		});

		this._token = this._token || sirenLink._token;
	}
}
