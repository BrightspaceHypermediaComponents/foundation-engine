import { assert }  from '@open-wc/testing';
import { StateStore } from '../state/stateStore.js';

let stateStore;
const entityID = 'HREF';
const token = 'TOKEN';
const defaultState = {
	entityID: entityID,
	token: token,
};

describe('State Store', () => {

	beforeEach(() => {
		stateStore = new StateStore();
	});

	describe('Add state', () => {

		const invalidStateTests = [
			{ state: undefined, description: 'is undefined' },
			{ state: {}, description: 'is empty' },
			{ state: { entityID: entityID }, description: 'is missing token' },
			{ state: { token: token }, description: 'is missing entityID' },
			{ state: { entityID: entityID, token: '' }, description: 'has an empty token' },
			{ state: { entityID: '', token: token }, description: 'has an empty ID' }
		];

		invalidStateTests.forEach((test) => {
			it(`should add a state when state ${test.description}`, () => {
				stateStore.add(test.state);
				assert.equal(stateStore._states.size, 0, 'State was added to the store');
			});
		});

		it('should add state to store', () => {
			stateStore.add(defaultState);
			assert.equal(stateStore._states.size, 1, 'State was not added to the store');
			assert.equal(stateStore._states.get(token).get(defaultState.entityID), defaultState,
				'Default state does not match');
		});

		it('should combine entities with the same token', () => {
			const state2 = {
				entityID: 'HREF2',
				token: token
			};

			stateStore.add(defaultState);
			stateStore.add(state2);

			assert.equal(stateStore._states.size, 1, 'States were not be mapped together by token');
			assert.equal(stateStore._states.get(token).size, 2, 'Expected 2 states in the token map');
			assert.equal(stateStore._states.get(token).get(defaultState.entityID), defaultState,
				'Default state does not match');
			assert.equal(stateStore._states.get(token).get(state2.entityID), state2,
				'Second state does not match');
		});

		it('should not combine entities with unique tokens', () => {
			const state2 = {
				entityID: 'HREF2',
				token: 'unique'
			};

			stateStore.add(defaultState);
			stateStore.add(state2);

			assert.equal(stateStore._states.size, 2, 'Tokens were not mapped together');
			assert.equal(stateStore._states.get(defaultState.token).size, 1,
				'Default token has more entities than expected');
			assert.equal(stateStore._states.get(state2.token).size, 1,
				'State2 token has more entities than expected');
			assert.equal(stateStore._states.get(token).get(defaultState.entityID), defaultState,
				'Default state does not match');
			assert.equal(stateStore._states.get(state2.token).get(state2.entityID), state2,
				'Second state does not match');
		});
	});

	const invalidStatePropertyTests = [
		{ state: { entityID: '', token: defaultState.token }, description: 'entityID is empty' },
		{ state: { entityID: defaultState.entityID, token: '' }, description: 'token is empty' },
		{ state: { entityID: 'invalid', token: defaultState.token }, description: 'entityID does not match' },
		{ state: { entityID: defaultState.entityID, token: 'invalid' }, description: 'token does not match' },
		{ state: { entityID: defaultState.entityID, token: defaultState.token.toLocaleLowerCase() },
			description: 'token case does not match' },
	];

	describe('Get States', () => {

		invalidStatePropertyTests.forEach((test) => {
			it(`Return false when ${test.description}`, () => {
				stateStore.add(defaultState);

				const foundState = stateStore.get(test.state.entityID, test.state.token);
				assert.isFalse(foundState, 'No matches should be found');
			});
		});

		it('should handle call when nothing has been added', () => {
			const foundState = stateStore.get(defaultState.entityID, defaultState.token);
			assert.isFalse(foundState, 'Should not return anything if there are no states');
		});

		it('should ignore case on entityID', () => {
			stateStore.add(defaultState);
			const foundState = stateStore.get(defaultState.entityID.toLowerCase(), defaultState.token);
			assert.equal(foundState, defaultState, 'Matched the wrong state');
		});

		it('should return the correct state when there are multiple states', () => {
			const state2 = {
				entityID: 'href-2',
				token: 'token-2'
			};

			stateStore.add(defaultState);
			stateStore.add(state2);

			let foundState = stateStore.get(defaultState.entityID, defaultState.token);
			assert.equal(foundState, defaultState, 'Matched the wrong state expected defaultState');

			foundState = stateStore.get(state2.entityID, state2.token);
			assert.equal(foundState, state2, 'Matched the wrong state expected state2');
		});

		it('should return the correct state when there are multiple states with the same token', () => {
			const state2 = {
				entityID: 'href-2',
				token: token
			};

			stateStore.add(defaultState);
			stateStore.add(state2);

			let foundState = stateStore.get(defaultState.entityID, defaultState.token);
			assert.equal(foundState, defaultState, 'Matched the wrong state expected defaultState');

			foundState = stateStore.get(state2.entityID, state2.token);
			assert.equal(foundState, state2, 'Matched the wrong state expected state2');
		});

		it('should return the correct state when there are multiple states with the same entintyID', () => {
			const state2 = {
				entityID: entityID,
				token: 'token-2'
			};

			stateStore.add(defaultState);
			stateStore.add(state2);

			let foundState = stateStore.get(defaultState.entityID, defaultState.token);
			assert.equal(foundState, defaultState, 'Matched the wrong state expected defaultState');

			foundState = stateStore.get(state2.entityID, state2.token);
			assert.equal(foundState, state2, 'Matched the wrong state expected state2');
		});
	});

	describe('Has State', () => {

		invalidStatePropertyTests.forEach((test) => {
			it(`Return false when ${test.description}`, () => {
				stateStore.add(defaultState);

				const foundState = stateStore.has(test.state.entityID, test.state.token);
				assert.isFalse(foundState, 'No matches should be found');
			});
		});

		it('should handle call when nothing has been added', () => {
			const foundState = stateStore.has(defaultState.entityID, defaultState.token);
			assert.isFalse(foundState, 'Should not return anything if there are no states');
		});

		it('should return true when there is a match', () => {
			stateStore.add(defaultState);
			const foundState = stateStore.has(defaultState.entityID, defaultState.token);
			assert.isTrue(foundState, 'Default state should have matched');
		});

		it('should ignore case on entityID', () => {
			stateStore.add(defaultState);
			const foundState = stateStore.has(defaultState.entityID.toLowerCase(), defaultState.token);
			assert.isTrue(foundState, 'EntityID should not be case sensitive');
		});
	});

});
