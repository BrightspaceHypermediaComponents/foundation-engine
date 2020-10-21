import 'd2l-fetch/d2l-fetch.js';
import { getToken, shouldAttachToken } from './token.js';
import { getEntityIdFromSirenEntity } from './sirenComponents/Common.js';
import { HypermediaState } from './HypermediaState.js';
import { StateStore } from './store.js';
import SirenParse from 'siren-parser';

window.D2L = window.D2L || {};
window.D2L.SirenSdk = window.D2L.SirenSdk || {};
window.D2L.SirenSdk.fetchStatus = window.D2L.SirenSdk.fetchStatus || new Map();
window.D2L.SirenSdk.d2lfetch = window.D2L.SirenSdk.d2lfetch || window.d2lfetch;
window.D2L.SirenSdk.StateStore = window.D2L.SirenSdk.StateStore || new StateStore();

export async function stateFactory(type, objParam, token) {
	switch (type) {
		case 'HypermediaState':
			return _fetch(objParam);
		case 'Link':
			return _stateFactoryByRawSirenEntity(objParam, token);
		case 'String':
			return _stateFactory(objParam, token);
	}
}

export async function performAction(action, input) {
	await action.refreshToken();

	const href = action.href(input);
	const body = action.body(input);

	const headers = action.header();
	!action.token.cookie && headers.set('Authorization', `Bearer ${action.token.value}`);

	const fetch = !action.token.cookie
		? window.D2L.SirenSdk.d2lfetch
		: window.D2L.SirenSdk.d2lfetch.removeTemp('auth');

	try {
		const response = await fetch.fetch(href, { headers, body, method: action.method });
		if (!response.ok) {
			throw response.status;
		}
		await _handleCachePriming(action.token, response);
		const json = await response.json();
		const entity = await SirenParse(json);
		const state = window.D2L.SirenSdk.fetchStatus.get(entity.getLink('self').href, action.token);

		state.onServerResponse(entity);
	} catch (err) {
		console.error(err);
	}
}

export async function refreshState(state, refetch = true) {
	await state.refreshToken();
	return _fetch(state, refetch);
}

export async function dispose(state, component) {
	state && state.dispose(component);
}

function _stateFactoryByRawSirenEntity(rawEntity, token) {
	const entityId = getEntityIdFromSirenEntity(rawEntity);
	if (!entityId) {
		const state = new HypermediaState(entityId, token);
		state.onServerResponse(rawEntity);
		return state;
	}

	return _stateFactory(entityId, shouldAttachToken(token, rawEntity));
}

async function _stateFactory(entityId, token) {
	if (!entityId) return;
	const tokenResolved = await getToken(token);
	const state = window.D2L.SirenSdk.StateStore.makeNewState(entityId, tokenResolved);
	window.D2L.SirenSdk.StateStore.add(state);
	return state;
}

async function _fetch(state, bypassCache = false) {

	if (!bypassCache) {
		if (!state || state.hasServerResponseCached()) {
			return true;
		}
	}

	await state.refreshToken();

	// TODO: Add better fetch control. Canceling, pending states and so on.
	if (!state || !state.entityId || !state.token.toString || (state.entity && !bypassCache)) {
		return;
	}

	if (window.D2L.SirenSdk.fetchStatus.has(state)) {
		return window.D2L.SirenSdk.fetchStatus.get(state);
	}

	let resolver;
	const promise = new Promise(resolve => resolver = resolve);
	window.D2L.SirenSdk.fetchStatus.set(state, promise);

	const headers = new Headers();
	!state.token.cookie && headers.set('Authorization', `Bearer ${state.token.value}`);

	const fetch = !state.token.cookie
		? window.D2L.SirenSdk.d2lfetch
		: window.D2L.SirenSdk.d2lfetch.removeTemp('auth');

	if (bypassCache) {
		headers.set('pragma', 'no-cache');
		headers.set('cache-control', 'no-cache');
	}

	try {
		const response = await fetch.fetch(state.entityId, { headers });
		if (!response.ok) {
			throw response.status;
		}
		await _handleCachePriming(state.token, response);
		const json = await response.json();
		const entity = await SirenParse(json);
		_addFetchedEntities(state.entityId, state.token, entity);

		state.onServerResponse(entity);
	} catch (err) {
		state.onServerResponse(null, err);
	} finally {
		resolver();
		window.D2L.SirenSdk.fetchStatus.delete(state);
	}
}

function _addFetchedEntities(href, token, entity) {
	const entityIndex = new Set();
	const expandEntities = [];
	entityIndex.add(href.toLowerCase());
	expandEntities.push(entity);

	while (expandEntities.length > 0) {
		const expandEntity = expandEntities.shift();
		(expandEntity.entities || []).forEach(entity => {
			expandEntities.push(entity);
		});

		if (!expandEntity.href && expandEntity.hasLinkByRel('self')) {
			const href = expandEntity.getLinkByRel('self').href.toLowerCase();
			if (!entityIndex.has(href)) {
				const state = window.D2L.SirenSdk.StateStore.makeNewState(href, token);
				state.onServerResponse(expandEntity);
				entityIndex.add(href);
			}
		}
	}
}

function _handleCachePriming(token, response) {
	const linkHeaderValues = response.headers && response.headers.get('Link');
	if (!linkHeaderValues) {
		return;
	}

	const cachePrimers = _parseLinkHeader(linkHeaderValues)
		.filter((link) => {
			return link.rel.indexOf('https://api.brightspace.com/rels/cache-primer') !== -1;
		});

	if (cachePrimers.length === 0) {
		return;
	}

	return Promise.all(cachePrimers.map((cachePrimer) => {
		const state = window.D2L.SirenSdk.StateStore.makeNewState(cachePrimer.href, token);
		return _fetch(state, true);
	}));
}

// parse a Link header
//
// Link:<https://example.org/.meta>; rel=meta
//
// var r = parseLinkHeader(xhr.getResponseHeader('Link');
// r['meta'] outputs https://example.org/.meta
//
function _parseLinkHeader(links) {
	const linkexp = /<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g; // eslint-disable-line no-useless-escape
	const paramexp = /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g; // eslint-disable-line no-useless-escape

	const matches = links.match(linkexp);
	const _links = [];
	for (let i = 0; i < matches.length; i++) {
		const split = matches[i].split('>');
		const href = split[0].substring(1);
		_links.push({
			href
		});
		const ps = split[1];
		const s = ps.match(paramexp);
		for (let j = 0; j < s.length; j++) {
			const p = s[j];
			const paramsplit = p.split('=');
			const name = paramsplit[0];
			const val = paramsplit[1].replace(/["']/g, '');
			if (name === 'rel') {
				const relsplit = val.split(' ');
				_links[i][name] = relsplit;
			} else {
				_links[i][name] = val;
			}
		}
	}
	return _links;
}
