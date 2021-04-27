import 'd2l-fetch/d2l-fetch.js';

const d2lfetch = window.d2lfetch;
window.D2L = window.D2L || {};
window.D2L.Foundation = window.D2L.Foundation || {};
window.D2L.Foundation.renderQueue = window.D2L.Foundation.renderQueue || [];
const renderQueue = window.D2L.Foundation.renderQueue;

/**
 * This method sends request to the server. It returns the results to fetchable.onServerResponse and the returned promise.
 * This method also handles cachePrimer header from the server with links with the rel, https://api.brightspace.com/rels/cache-primer.
 * A list of the links that need to be primed are sent to fetchable.handleCachePriming method.
 * @param {Fetchable} fetchable Is an object that inherits from the class fetchable. This is the object that will be fetched.
 * @param {boolean} bypassCache Default is `false`. If bypassCache is true then it will cancel any pending request
 *                              and send a new request to the server with no-cache headers.
 * @returns {Promise} This promise will resolve to a json object, or null if the request is canceled.
 * 					  If there was an error in fetching then this promised is rejected with an error message.
 */
export function fetch(fetchable, bypassCache = false) {
	if (!fetchable.href) return;
	if (fetchable.fetchStatus.pending) {
		if (!bypassCache) {
			return fetchable.fetchStatus.complete;
		}
		fetchable.fetchStatus.cancel();
	}

	if (!bypassCache && fetchable.hasServerResponseCached()) return fetchable.fetchStatus.complete;

	const responsePromise = fetchable.fetchStatus.start();

	const fetchPromise = performServerFetch(fetchable, bypassCache);

	fetchPromise
		.then(async(json) => {
			await fetchable.onServerResponse(json);
			fetchable.fetchStatus.done(json);
		})
		.catch(async(error) => {
			try {
				await fetchable.onServerResponse(null, error);
			} catch (e) {
				error = e;
			}
			fetchable.fetchStatus.done(null, error);
		});
	renderQueue.push(responsePromise);
	return responsePromise;
}

/**
 * This method is a helper for fetch. It handles the actual sending of the request.
 * @param {Fetchable} fetchable Is an object that inherits from the class fetchable. This is the object that will be fetched.
 * @param {boolean} bypassCache Default is `false`. If bypassCache is true then it will cancel any pending request
 *                              and send a new request to the server with no-cache headers.
 * @returns {Promise} This promise will resolve when fetchable is fetched
 */
async function performServerFetch(fetchable, bypassCache) {
	await fetchable.refreshToken();

	const fetch = !fetchable.token.cookie ? d2lfetch : d2lfetch.removeTemp('auth');

	const headers = fetchable.headers;
	if (bypassCache) {
		fetchable.byPassCache();
		headers.set('pragma', 'no-cache');
		headers.set('cache-control', 'no-cache');
	}

	const response = await fetch.fetch(fetchable.href, { headers, body: fetchable.body, method: fetchable.method });
	if (!response.ok) {
		throw response.status;
	}
	await fetchable.handleCachePriming(cachePrimingList(response));
	return response.json();

}

/**
 * This method constructs a array of links that we need to start handling!
 * @param {Response} response A successful response from the server. One with response.ok = true.
 * @returns {Array} An array of strings that represents links we need to handle.
 */
function cachePrimingList(response) {
	const linkHeaderValues = response.headers && response.headers.get('Link');
	if (!linkHeaderValues) {
		return [];
	}

	const cachePrimers = parseLinkHeader(linkHeaderValues)
		.filter((link) => {
			return link.rel.indexOf('https://api.brightspace.com/rels/cache-primer') !== -1 && link.href;
		})
		.map(link => link.href);

	return cachePrimers;
}

// parse a Link header
//
// Link:<https://example.org/.meta>; rel=meta
//
// var r = parseLinkHeader(xhr.getResponseHeader('Link');
// r['meta'] outputs https://example.org/.meta
//
function parseLinkHeader(links) {
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
