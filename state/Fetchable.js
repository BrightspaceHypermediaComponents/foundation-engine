import { refreshToken } from './token.js';

/**
 * FetchError
 * Custom error type for errors associated with Fetchable objects
 */
export class FetchError extends Error {}

/**
 * FetchStatus
 * Object for tracking the pending status of an object
 * @property {Promise} complete Promise that resolves when the fetch is complete
 * @property {Boolean} pending Whether the fetch has started
 */
class FetchStatus {
	constructor() {
		this.complete = null;
		this.pending = false;
	}

	/**
	 * Resolves Promise to null and sets pending status to false
	 */
	cancel() {
		if (!this.pending) throw new FetchError('Cannot call cancel() on a status that is not pending');
		this._resolver(null);
		this.pending = false;
	}

	/**
	 * Resolves Promise to true and sets pending status to false
	 */
	done(response, error) {
		if (!this.pending) throw new FetchError('Cannot call done() on a status that is not pending');
		error ? this._rejecter(error) : this._resolver(response);
		this.pending = false;
	}

	/**
	 * Creates a Promise and sets pending status to true
	 */
	start() {
		this.complete = new Promise((resolve, reject) => {
			this._resolver = resolve;
			this._rejecter = reject;
		});
		this.pending = true;

		return this.complete;
	}
}

/**
 * Fetchable mixin
 * Behaviour interface for objects that can be fetched from the server
 * @mixin
 */
export const Fetchable = superclass => class extends superclass {

	/**
	 * @param {String} href The href to fetch the object from
	 * @param {Token} token The token object associated with the item
	 */
	constructor(href, token) {
		super();
		this._body = null;
		this._fetchStatus = new FetchStatus();
		this._headers = null;
		this._href = href;
		this._token = token;
	}

	/**
	 * @returns {Object} The body of the request
	 */
	get body() {
		return this._body;
	}

	/**
	 * @returns {FetchStatus} Status object for the fetch
	 */
	get fetchStatus() {
		return this._fetchStatus;
	}

	/**
	 * abstract, handles links in cache primer.
	 * @param links the links the prime in the cache.
	 */
	handleCachePriming() {}

	hasServerResponseCached() { return false; }

	/**
	 * @returns {Headers} Headers for the request
	 */
	get headers() {
		this._initHeaders();
		return this._headers;
	}

	/**
	 * @returns {String} href that identifies the fetchable
	 */
	get href() {
		return this._href;
	}

	/**
	 * @returns {String} The method to be used in the request. Default is GET
	 */
	get method() {
		return this._method || 'GET';
	}

	onServerResponse() {}

	/**
	 * Refreshes the token object
	 * @returns {Promise}
	 */
	async refreshToken() {
		await refreshToken(this.token);
	}

	/**
	 * @param {Object} paramsObj An object representing key value pairs or lists of query parameters
	 * E.g. { key: 'input-for-key' } or { key: ['input1', 'input2']}
	 * @returns {String} A URL containing the query string
	 */
	setQueryParams(paramsObj) {
		let url = new URL(this.href, window.location.origin);
		const params = new URLSearchParams(Object.keys(paramsObj).map(field => [field, paramsObj[field]]));
		url = new URL(`${url.pathname}?${params.toString()}`, url.origin);
		this._href = url.toString();
		return this._href;
	}

	/**
	 * @returns {Token} Token object associated with the object
	 */
	get token() {
		return this._token;
	}

	/**
	 * Initializes the headers for the fetch
	 */
	_initHeaders() {
		const headers = new Headers();
		!this.token.cookie && headers.set('Authorization', `Bearer ${this.token.value}`);
		this._headers = headers;
	}
};
