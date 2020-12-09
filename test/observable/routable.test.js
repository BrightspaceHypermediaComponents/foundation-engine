import { assert }  from '@open-wc/testing';
import { Observable } from '../../state/observable/Observable.js';
import { Routable } from '../../state/observable/Routable.js';

class Tester extends Routable(Observable) { }

describe.only('adding and removing observers', () => {
	let subentity, obs;

	beforeEach(() => {
		subentity = new Tester({});
		obs = { foo: undefined };
	});

	it('should add an object with route', () => {
		subentity.addObserver(obs, 'hello', { route: { value: 'abcde' } });

		const map = subentity._observers._observers;
		assert.equal(map.size, 0, 'SirenSubEntity has incorrect number of observers');

		const routes = subentity._routes;
		assert.equal(routes.size, 1, 'incorrect number of routes stored in observer');
		assert.equal(routes.get(obs).value, 'abcde', 'route set incorrectly for observer');

		const methods = subentity._observers._methods;
		assert.isFalse(methods.has(obs), 'method for observer is not stored');
	});

	it('should remove an object with a route', () => {
		subentity.addObserver(obs, 'hello', { route: 'abcde' });
		subentity.deleteObserver(obs);

		const map = subentity._observers._observers;
		assert.equal(map.size, 0, 'SirenSubEntity has incorrect number of observers');

		const routes = subentity._routes;
		assert.equal(routes.size, 0, 'incorrect number of routes stored in observer');
	});

	it('should add an object without a route', () => {
		subentity.addObserver(obs, 'hello');

		const map = subentity._observers._observers;
		assert.equal(map.size, 1, 'SirenSubEntity has incorrect number of observers');
		assert.equal(map.get(obs), 'hello');

		const routes = subentity._routes;
		assert.equal(routes.size, 0, 'incorrect number of routes stored in observer');
	});

	it('should remove an object without a route', () => {
		subentity.addObserver(obs, 'hello');
		subentity.deleteObserver(obs);

		const map = subentity._observers._observers;
		assert.equal(map.size, 0, 'SirenSubEntity has incorrect number of observers');

		const routes = subentity._routes;
		assert.equal(routes.size, 0, 'incorrect number of routes stored in observer');
	});

});
