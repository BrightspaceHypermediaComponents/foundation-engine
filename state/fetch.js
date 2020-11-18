import 'd2l-fetch/d2l-fetch.js';

const d2lfetch = window.d2lfetch;

export async function fetch(fetchable, { bypassCache }) {
	if (fetchable.fetchStatus.pending) {
		return fetchable.fetchStatus.complete;
	}

	fetchable.fetchStatus.start();

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
		fetchable.onServerResponse(response);
	} catch (err) {
		fetchable.onServerResponse(null, err);
	} finally {
		fetchable.fetchStatus.done();
	}
}

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
