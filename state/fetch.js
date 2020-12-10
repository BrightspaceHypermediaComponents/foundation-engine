import 'd2l-fetch/d2l-fetch.js';

const d2lfetch = window.d2lfetch;

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
	if (fetchable.fetchStatus.pending) {
		if (!bypassCache) {
			return fetchable.fetchStatus.complete;
		}
		fetchable.fetchStatus.cancel();
	}

	const responsePromise = fetchable.fetchStatus.start();

	performServerFetch(fetchable, bypassCache);

	return responsePromise
		.then(json => {
			fetchable.onServerResponse(json);
			return json;
		})
		.catch(error => {
			fetchable.onServerResponse(null, error);
			throw error;
		});
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
		headers.set('pragma', 'no-cache');
		headers.set('cache-control', 'no-cache');
	}

	try {
		const response = await fetch.fetch(fetchable.href, { headers, body: fetchable.body, method: fetchable.method });
		if (!response.ok) {
			throw response.status;
		}
		fetchable.handleCachePriming(cachePrimingList(response));
		const json = await response.json();
		fetchable.fetchStatus.done(json);
	} catch (err) {
		fetchable.fetchStatus.done(null, err);
	}
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
