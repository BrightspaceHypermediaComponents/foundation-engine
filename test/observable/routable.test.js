import { assert }  from '@open-wc/testing';
import { Observable } from '../../state/observable/Observable.js';
import { Routable } from '../../state/observable/Routable.js';

class RoutableObservable extends Routable(Observable) { }

describe('adding and removing observers', () => {
	let routableobservable, obs;

	beforeEach(() => {
		routableobservable = new RoutableObservable({});
		obs = { foo: undefined };
	});

	it('should add an object with route', () => {
		routableobservable.addObserver(obs, 'hello', { route: { value: 'abcde' } });

		const map = routableobservable._observers._observers;
		assert.equal(map.size, 0, 'routable has incorrect number of observers');

		const routes = routableobservable._routes;
		assert.equal(routes.size, 1, 'incorrect number of routes stored in observer');
		assert.equal(routes.get(obs).value, 'abcde', 'route set incorrectly for observer');

		const methods = routableobservable._observers._methods;
		assert.isFalse(methods.has(obs), 'method for observer is not stored');
	});

	it('should remove an object with a route', () => {
		routableobservable.addObserver(obs, 'hello', { route: 'abcde' });
		routableobservable.deleteObserver(obs);

		const map = routableobservable._observers._observers;
		assert.equal(map.size, 0, 'routable has incorrect number of observers');

		const routes = routableobservable._routes;
		assert.equal(routes.size, 0, 'incorrect number of routes stored in observer');
	});

	it('should add an object without a route', () => {
		routableobservable.addObserver(obs, 'hello');

		const map = routableobservable._observers._observers;
		assert.equal(map.size, 1, 'routable has incorrect number of observers');
		assert.equal(map.get(obs), 'hello');

		const routes = routableobservable._routes;
		assert.equal(routes.size, 0, 'incorrect number of routes stored in observer');
	});

	it('should remove an object without a route', () => {
		routableobservable.addObserver(obs, 'hello');
		routableobservable.deleteObserver(obs);

		const map = routableobservable._observers._observers;
		assert.equal(map.size, 0, 'routable has incorrect number of observers');

		const routes = routableobservable._routes;
		assert.equal(routes.size, 0, 'incorrect number of routes stored in observer');
	});

});
