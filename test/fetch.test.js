import { aTimeout, expect }  from '@open-wc/testing';
import { Fetchable, FetchError } from '../state/Fetchable.js';
import { getToken, TOKEN_COOKIE } from '../state/token.js';
import { fetch } from '../state/fetch.js';
import { default as sinon } from 'sinon/pkg/sinon-esm.js';

let sandbox;
class FetchableObject extends Fetchable(Object) {
	constructor(href, token) {
		super(href, token);
		this.onServerResponseCalled = new Promise((resolve) => this._resolver = resolve);
	}
	get body() { return 'body'; }
	handleCachePriming(links) {
		this.links = links;
	}
	onServerResponse(json, error) {
		this.json = json;
		this.error = error;
		this._resolver(true);
	}
	resetLinks() {
		this.links = undefined;
	}
}

let token, fetchStub, removeTempStub;

const hrefGoodStatus = 'http://resource-with-good-status.d2l';
const hrefBadStatus = 'http://resource-with-bad-status.d2l';
const headerResponse = { Link: '' };
const clearHeaderResponse = () => headerResponse.Link = '';

const responses = {
	[hrefGoodStatus]: (jsonResponse) => {
		return {
			status: 200,
			ok: true,
			json: async() => jsonResponse,
			headers: {
				get: (index) => headerResponse[index]
			}
		};
	},
	[hrefBadStatus]: () => { return { status: 400, ok: false }; }
};

before(async() => {
	sandbox = sinon.createSandbox();
	removeTempStub = sandbox.stub(window.d2lfetch, 'removeTemp').callsFake(() => window.d2lfetch);
	token = await getToken('someToken');
	fetchStub = sandbox.stub(window.d2lfetch, 'fetch')
		.callsFake(async(href, { body, headers, method }) => {
			await aTimeout(100); // lets cause a bit of a delay
			return responses[href]({ request: { body, headers, method } });
		});
});

after(() => {
	sandbox.restore();
});

describe('fetch', () => {
	afterEach(() => {
		fetchStub.resetHistory();
		removeTempStub.resetHistory();
	});

	it('should fetch an fetchable object that exists', async() => {
		const fetchable = new FetchableObject(hrefGoodStatus, token);
		const response = await fetch(fetchable);
		expect(response.request.body).to.equal('body');
		expect(response.request.headers.get('Authorization')).to.equal(`Bearer ${token.value}`);
		expect(response.request.method).to.equal('GET');
	});

	it('should call Fetchable.onServerResponse with json on an ok response', async() => {
		const fetchable = new FetchableObject(hrefGoodStatus, token);
		const onServerResponseSpy = sandbox.spy(fetchable, 'onServerResponse');
		await fetch(fetchable);
		await fetchable.onServerResponseCalled;
		expect(onServerResponseSpy.calledOnce).to.be.true;
		expect(fetchable.error).to.be.undefined;
		expect(fetchable.json.request.body).to.equal('body');
		expect(fetchable.json.request.headers.get('Authorization')).to.equal(`Bearer ${token.value}`);
		expect(fetchable.json.request.method).to.equal('GET');
	});

	it('should throw an error on bad request', async() => {
		const fetchable = new FetchableObject(hrefBadStatus, token);
		let processError;
		try {
			await fetch(fetchable);
		} catch (error) {
			processError = error;
		}
		expect(processError).to.include(FetchError);
		expect(processError.message).to.equal('400');
	});

	it('should call Fetchable.onServerResponse with error on a not ok response', async() => {
		const fetchable = new FetchableObject(hrefBadStatus, token);
		const onServerResponseSpy = sandbox.spy(fetchable, 'onServerResponse');
		let processError;
		try {
			await fetch(fetchable);
		} catch (error) {
			processError = error;
		}
		await fetchable.onServerResponseCalled;
		expect(onServerResponseSpy.calledOnce).to.be.true;
		expect(fetchable.json).to.be.null;
		expect(fetchable.error).to.include(FetchError);
		expect(fetchable.error.message).to.equal('400');
		expect(processError).to.equal(processError);
	});

	it('fetching the same href at the same time will only run one fetch and return the same promise', async() => {
		//Being super verbose and step wise on purpose!
		const fetchableOne = new FetchableObject(hrefGoodStatus, token);
		const promiseOne = fetch(fetchableOne);
		const promiseTwo = fetch(fetchableOne);
		expect(promiseOne).to.equal(promiseTwo);

		const responseOne = await promiseOne;
		const responseTwo = await promiseTwo;

		expect(fetchStub.calledOnce).is.true;
		expect(responseOne).to.equal(responseTwo);
	});

	it('will not call removeTemp with parameter \'auth\' when a token is sent by header', async() => {
		const fetchable = new FetchableObject(hrefGoodStatus, token);
		const response = await fetch(fetchable);
		expect(response.request.headers.get('Authorization')).to.equal(`Bearer ${token.value}`);
		expect(removeTempStub.notCalled).to.be.true;
	});

	it('will call removeTemp with parameter \'auth\' when a cookie is used as a token', async() => {
		const cookieToken = await getToken(TOKEN_COOKIE);
		const fetchable = new FetchableObject(hrefGoodStatus, cookieToken);
		const response = await fetch(fetchable);
		expect(response.request.headers.get('Authorization')).to.be.null;
		expect(removeTempStub.calledOnceWith('auth')).to.be.true;
	});

	it('does not add cache headers if it is not bypassing', async() => {
		const fetchable = new FetchableObject(hrefGoodStatus, token);
		const response = await fetch(fetchable);
		expect(response.request.headers.get('pragma')).to.be.null;
		expect(response.request.headers.get('cache-control')).to.be.null;
	});

	it('bypassing the cache adds correct headers', async() => {
		const fetchable = new FetchableObject(hrefGoodStatus, token);
		const response = await fetch(fetchable, true);
		expect(response.request.headers.get('pragma')).to.equal('no-cache');
		expect(response.request.headers.get('cache-control')).to.equal('no-cache');
	});

	it('bypassing the cache will cause a second fetch!', async() => {
		//Being super verbose and step wise on purpose!
		const fetchableOne = new FetchableObject(hrefGoodStatus, token);
		const promiseOne = fetch(fetchableOne);
		const promiseTwo = fetch(fetchableOne, true);
		expect(promiseOne).to.not.equal(promiseTwo);

		const responseOne = await promiseOne;
		const responseTwo = await promiseTwo;

		expect(fetchStub.calledTwice).is.true;
		expect(responseOne).to.be.null;
		expect(responseTwo.request.body).to.equal('body');
		expect(responseTwo.request.headers.get('Authorization')).to.equal(`Bearer ${token.value}`);
		expect(responseTwo.request.method).to.equal('GET');
	});

	describe('Link Parse Header', () => {
		let fetchable;
		before(() => {
			fetchable = new FetchableObject(hrefGoodStatus, token);
		});
		afterEach(() => {
			clearHeaderResponse();
			fetchable.resetLinks();
		});

		it('can parse no link header', async() => {
			headerResponse.Link = '';
			await fetch(fetchable);
			expect(fetchable.links).deep.to.equal([]);
		});

		it('can parse a single link header', async() => {
			headerResponse.Link = '<https://example.org/.meta>; rel="https://api.brightspace.com/rels/cache-primer"; title="previous chapter"';
			await fetch(fetchable);
			expect(fetchable.links).deep.to.equal(['https://example.org/.meta']);
		});

		it('can parse a link header with multiple entries', async() => {
			headerResponse.Link = '<https://example.org/.meta>; rel="https://api.brightspace.com/rels/cache-primer", <https://example.org/related>; rel="https://api.brightspace.com/rels/cache-primer"';
			await fetch(fetchable);
			expect(fetchable.links).deep.to.equal(['https://example.org/.meta', 'https://example.org/related']);
		});

		it('can parse a link header where only one has the right rel', async() => {
			headerResponse.Link = '<https://example.org/.meta>; rel="https://api.brightspace.com/rels/cache-primer", <https://example.org/related>; rel=related';
			await fetch(fetchable);
			expect(fetchable.links).deep.to.equal(['https://example.org/.meta']);
		});

		it('can parse a link header with multiple rels', async() => {
			headerResponse.Link = '<https://example.org/.meta>; rel="start https://api.brightspace.com/rels/cache-primer"';
			await fetch(fetchable);
			expect(fetchable.links).deep.to.equal(['https://example.org/.meta']);
		});
	});
});
