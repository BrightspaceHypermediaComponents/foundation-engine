import { fetch, stateFactory } from '../store.js';
//import { Component } from './Common.js';
import { Observable } from './Observable.js';
import { shouldAttachToken } from '../token.js';

export class SirenLink extends Observable {
	constructor({ id, token }) {
		super();
		this._rel = id;
		this._routes = new Map();
		this._token = token;
	}

	get link() {
		return this._link;
	}

	set link(link) {
		if (!this._link !== link) {
			this._observers.setProperty(link && link.href);
		}
		this._link = link;

	}

	addObserver(observer, property, { route, method }) {
		if (route) {
			const currentRoute = this._routes.has(observer) ? this._routes.get(observer) : {};
			this._routes.set(observer, { ...currentRoute, ...route });
			return;
		}
		super.addObserver(observer, property, method, this.link && this.link.href)
	}

	get childState() {
		return this._childState;
	}

	deleteObserver(observer) {
		if (this._routes.has(observer)) {
			this._childState.dispose(observer);
			this._routes.delete(observer);
			return;
		}
		super.deleteObserver(observer);
	}

	get rel() {
		return this._rel;
	}

	async setSirenEntity(sirenEntity, linkCollectionMap) {
		this.link = sirenEntity && sirenEntity.hasLinkByRel(this.rel) && sirenEntity.getLinkByRel(this.rel);
		if (!this.link) return;

		if (linkCollectionMap && linkCollectionMap instanceof Map) {
			this.link.rel.forEach(rel => {
				if (linkCollectionMap.has(rel) && this !== linkCollectionMap.get(rel)) {
					this._merge(linkCollectionMap.get(rel));
				}
				linkCollectionMap.set(rel, this);
			});
		}

		if (this._token) {
			this._childState = await stateFactory(this.link.href, shouldAttachToken(this._token, this.link));
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

		sirenLink._observers.observers.forEach((observer, property) => {
			this.addObserver(observer, property);
		});

		this._token = this._token || sirenLink._token;
	}
}
