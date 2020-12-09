import { assert }  from '@open-wc/testing';
import { SirenSummonAction } from '../../state/observable/SirenSummonAction.js';

describe.only('SirenSummonAction', () => {
	it('construction', () => {
		const summonAction = new SirenSummonAction({ id: 'foo', token: 'abc', prime: true });

		assert.isTrue(summonAction._prime, 'prime set from constructor parameter');
		assert.equal(summonAction._name, 'foo', 'name set from constructor parameter');
		assert.equal(summonAction._token, 'abc', 'token set from constructor parameter');
		assert.instanceOf(summonAction._routes, Map, 'routes initializes to empty map');
	});

	it('set action', () => {
		const summonAction = new SirenSummonAction({ id: 'foo', token: 'abc', prime: true });
		summonAction.action = { has: true, summon: () => 'result' };

		assert.isTrue(summonAction.action.has, 'action has a function');
		assert.equal(summonAction.action.summon(), 'result', 'calling summon returns its result');
	});
});
