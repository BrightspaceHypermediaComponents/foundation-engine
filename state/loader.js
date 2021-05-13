class LoadingGroup {
	constructor(fetchable) {
		this._loaded = new Promise(resolver => this._loadedResolver = resolver);
		this._fetchables = [];
		this._fetching = [];
		this._waitForHref = [];
		this._setupNoMoreChildrenPromise();
		this.addFetchable(fetchable);
	}

	addFetchable(fetchable) {
		if (this._fetchables.length > 0 && this._fetchables.some(observedFetchable => fetchable === observedFetchable)) return;
		this._waitForHref = this._waitForHref.filter(href => href !== fetchable.href);
		this._fetchables.push(fetchable);
		this._fetching.push(this.queue(fetchable));
	}

	hasFetchable(fetchable) {
		return this._fetchables.some(observedFetchable => fetchable === observedFetchable)
			|| this._waitForHref.some(href => href === fetchable.href);
	}

	get loaded() {
		return this._loaded;
	}

	async queue(fetchable) {
		await fetchable.fetchStatus.waitForNextFetch;
		await fetchable.fetchStatus.complete;
		await fetchable.waitAfterFetch();
		fetchable.childHrefs.forEach(href => {
			if (this._fetchables.length > 0 && this._fetchables.some(observedFetchable => href === observedFetchable.href)) return;
			this._waitForHref.push(href);
		});
		if (this._noMoreChildrenResolver && this._waitForHref.length === 0) {
			this._noMoreChildrenResolver();
		}
	}

	waitForHref(href) {
		this._waitForHref.push(href);
	}

	async _setupNoMoreChildrenPromise() {
		const promise = new Promise(resolve => this._noMoreChildrenResolver = resolve);
		await promise;
		this._noMoreChildrenResolver = null;
		for await (const fetchable of this._fetching) {
			await fetchable;
		}
		if (this._waitForHref.length <= 0) {
			this._loadedResolver();
			return;
		}

		this._setupNoMoreChildrenPromise();
	}
}

class Loaders {
	constructor() {
		this._loadingGroups = [];
	}

	putInLoadingGroup(fetchable) {
		let group;
		const done = this._loadingGroups.some(loadingGroup => {
			group = loadingGroup;
			loadingGroup.addFetchable(fetchable);
			return true;
		});
		if (done) return group;

		group = new LoadingGroup(fetchable);
		this._loadingGroups.push(new LoadingGroup(fetchable));
		return group;
	}
}

window.D2L = window.D2L || {};
window.D2L.Foundation = window.D2L.Foundation || {};
window.D2L.Foundation.Loaders = window.D2L.Foundation.Loaders || new Loaders();

const loaders = window.D2L.Foundation.Loaders;

export function myLoadingPromise(fetchable) {
	const loadingGroup = loaders.putInLoadingGroup(fetchable);
	return loadingGroup.loaded;
}
