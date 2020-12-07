import { fetch } from '../fetch.js';
import { Observable } from './Observable.js';
import { shouldAttachToken } from '../token.js';

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
		if (this.href !== href) {
			this._observers.setProperty(href);
		}
	}

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
		console.log(`@@@ ${JSON.stringify(this._token)}`);
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
			console.log('@@@' + JSON.stringify(this._childState));
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

		this._observers.merge(sirenLink._observers);
		this._token = this._token || sirenLink._token;
	}
}
