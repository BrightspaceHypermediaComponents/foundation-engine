import { fetch } from '../fetch.js';
import { Observable } from './Observable.js';
import { Routable } from './Routable.js';
import { shouldAttachToken } from '../token.js';

export class SirenLink extends Routable(Observable) {
	constructor({ id, token, state } = {}) {
		super({});
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
			this.routedState = await this.createRoutedState(link.href, shouldAttachToken(this._token.rawToken, link));
			this._routes.forEach((route, observer) => {
				this.routedState.addObservables(observer, route);
			});

			fetch(this.routedState);
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
