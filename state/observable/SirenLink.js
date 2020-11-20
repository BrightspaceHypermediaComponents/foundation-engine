import { Observable } from './Observable.js';
import { shouldAttachToken } from '../token.js';

export class SirenLink extends Observable {
	constructor({ id, token, state }) {
		super({ state });
		this._rel = id;
		this._routes = new Map();
		this._token = token;
	}

	get href() {
		return this._observers.value;
	}

	set href(href) {
		if (!this.href !== href) {
			this._observers.setProperty(href && href.href);
		}
	}

	// TODO: remove in US121366
	addObserver(observer, property, { route, method }) {
		if (route) {
			this._addRoute(observer, route);
		} else {
			super.addObserver(observer, property, method);
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
		this.href = sirenEntity && sirenEntity.hasLinkByRel(this.rel) && sirenEntity.getLinkByRel(this.rel);
		if (!this.href) return;

		if (linkCollectionMap && linkCollectionMap instanceof Map) {
			this.href.rel.forEach(rel => {
				if (linkCollectionMap.has(rel) && this !== linkCollectionMap.get(rel)) {
					this._merge(linkCollectionMap.get(rel));
				}
				linkCollectionMap.set(rel, this);
			});
		}

		if (this._token) {
			this._childState = await this.createChildState(this.href.href, shouldAttachToken(this._token, this.href));
			this._routes.forEach((route, observer) => {
				this._childState.addObservables(observer, route);
			});
			// TODO: waiting for fetch function
			//fetch(this._childState);
		}
	}

	_merge(sirenLink) {
		if (!sirenLink || !(sirenLink instanceof SirenLink)) {
			return;
		}

		sirenLink._observers.observers.forEach((observer, property) => {
			this.addObserver(observer, property);
		});

		this._token = this._token || sirenLink._token;
	}
}
