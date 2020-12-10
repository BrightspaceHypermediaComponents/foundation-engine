import { assert }  from '@open-wc/testing';
import { SirenSummonAction } from '../../state/observable/SirenSummonAction.js';

describe('SirenSummonAction', () => {
	it('construction', () => {
		const summonAction = new SirenSummonAction({ id: 'foo', token: 'abc', prime: true });

		assert.isTrue(summonAction._prime, 'prime set from constructor parameter');
		assert.equal(summonAction._name, 'foo', 'name set from constructor parameter');
		assert.equal(summonAction._token, 'abc', 'token set from constructor parameter');
		assert.instanceOf(summonAction._routes, Map, 'routes initializes to empty map');
	});

	describe('set action', () => {
		it('should set action to given object', () => {
			const summonAction = new SirenSummonAction({ id: 'foo', token: 'abc', prime: true });
			summonAction.action = { has: true, summon: () => 'result' };

			assert.isTrue(summonAction.action.has, 'action has a function');
			assert.equal(summonAction.action.summon(), 'result', 'calling summon returns its result');
		});

		it('has is false, should set action to defaultSummon', () => {
			const summonAction = new SirenSummonAction({ id: 'foo', token: 'abc', prime: true });
			summonAction.action = { has: false, summon: () => 'result' };

			assert.isFalse(summonAction.action.has, 'action does not have summon');
			assert.isUndefined(summonAction.action.summon(), 'result from summon should be undefined');
		});

		it('summon is not function, should set action to defaultSummon', () => {
			const summonAction = new SirenSummonAction({ id: 'foo', token: 'abc', prime: true });
			summonAction.action = { has: true, summon: 'summon' };

			assert.isFalse(summonAction.action.has, 'action does not have summon');
			assert.isUndefined(summonAction.action.summon(), 'result from summon should be undefined');
		});

		it('has is false and summon is not function, should set action to defaultSummon', () => {
			const summonAction = new SirenSummonAction({ id: 'foo', token: 'abc', prime: true });
			summonAction.action = { has: false, summon: 'summon' };

			assert.isFalse(summonAction.action.has, 'action does not have summon');
			assert.isUndefined(summonAction.action.summon(), 'result from summon should be undefined');
		});

		it('action is set twice', () => {
			const summonAction = new SirenSummonAction({ id: 'foo', token: 'abc', prime: true });
			summonAction.action = { has: true, summon: 'summon' };
			summonAction.action = { has: true, summon: 'summon' };

			assert.isFalse(summonAction.action.has, 'action does not have summon');
			assert.isUndefined(summonAction.action.summon(), 'result from summon should be undefined');
		});

		it('action is reset', () => {
			const summonAction = new SirenSummonAction({ id: 'foo', token: 'abc', prime: true });
			const action = { has: true, summon: () => 'foo' };
			summonAction.action = action;
			summonAction.action = action;

			assert.isTrue(summonAction.action.has, 'action does not have summon');
			assert.equal(summonAction.action.summon(), 'foo', 'result from summon unchanged');
		});

		it('summon is updated', () => {
			const summonAction = new SirenSummonAction({ id: 'foo', token: 'abc', prime: true });
			summonAction.action = { has: true, summon: () => 'foo' };
			summonAction.action = { has: true, summon: () => 'bar' };

			assert.isTrue(summonAction.action.has, 'action does have summon');
			assert.equal(summonAction.action.summon(), 'bar', 'summon should be undated to return bar');
		});
	});
});
