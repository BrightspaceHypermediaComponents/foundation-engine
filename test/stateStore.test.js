// import { processRawJsonSirenEntity, stateFactory } from '../state/HypermediaState';
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
		it('should not add an undefined state', () => {
			const state = undefined;
			stateStore.add(state);
			assert.equal(stateStore._states.size, 0, 'State was added to the store');
		});

		it('should not add an empty state', () => {
			const state = {};
			stateStore.add(state);
			assert.equal(stateStore._states.size, 0, 'State was added to the store');
		});

		it('should not add a state without token', () => {
			const state = {
				entityID: entityID
			};

			stateStore.add(state);
			assert.equal(stateStore._states.size, 0, 'State was added to the store');
		});

		it('should not add a state without ID', () => {
			const state = {
				token: token
			};

			stateStore.add(state);
			assert.equal(stateStore._states.size, 0, 'State was added to the store');
		});

		it('should not add a state with empty token', () => {
			const state = {
				entityID: entityID,
				token: ''
			};

			stateStore.add(state);
			assert.equal(stateStore._states.size, 0, 'State was added to the store');
		});

		it('should not add a state with empty ID', () => {
			const state = {
				entityID: '',
				token: token
			};

			stateStore.add(state);
			assert.equal(stateStore._states.size, 0, 'State was added to the store');
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

	describe('Get States', () => {
		it('should handle an undefined entityID', () => {
			const foundState = stateStore.get(undefined, defaultState.token);
			assert.isFalse(foundState, 'Undefined entity ID should return false');
		});

		it('should handle an undefined token', () => {
			const foundState = stateStore.get(defaultState.entityID, undefined);
			assert.isFalse(foundState, 'Undefined token should return false');
		});

		it('should handle an empty entityID', () => {
			const foundState = stateStore.get('', defaultState.token);
			assert.isFalse(foundState, 'Empty entity ID should return false');
		});

		it('should handle an empty token', () => {
			const foundState = stateStore.get(defaultState.entityID, '');
			assert.isFalse(foundState, 'Empty token should return false');
		});

		it('should handle call when nothing has been added', () => {
			const foundState = stateStore.get(defaultState.entityID, defaultState.token);
			assert.isFalse(foundState, 'Should not return anything if there are no states');
		});

		it('should not return a state if entityID does not match', () => {
			stateStore.add(defaultState);
			const foundState = stateStore.get('invalid', defaultState.token);
			assert.isFalse(foundState, 'EntityID should not match a state');
		});

		it('should not return a state if token does not match', () => {
			stateStore.add(defaultState);
			const foundState = stateStore.get(defaultState.entityID, 'invalid');
			assert.isFalse(foundState, 'Token should not match a state');
		});

		it('should ignore case on entityID', () => {
			stateStore.add(defaultState);
			const foundState = stateStore.get(defaultState.entityID.toLowerCase(), defaultState.token);
			assert.equal(foundState, defaultState, 'Matched the wrong state');
		});

		it('should only match exact tokens', () => {
			stateStore.add(defaultState);
			const foundState = stateStore.get(defaultState.entityID, defaultState.token.toLowerCase());
			assert.isFalse(foundState, 'Token should be an exact match');
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
		it('should handle an undefined entityID', () => {
			const foundState = stateStore.has(undefined, defaultState.token);
			assert.isFalse(foundState, 'Undefined entityID should return false');
		});

		it('should handle an undefined token', () => {
			const foundState = stateStore.has(defaultState.entityID, undefined);
			assert.isFalse(foundState, 'Undefined token should return false');
		});

		it('should handle an empty entityID', () => {
			const foundState = stateStore.has('', defaultState.token);
			assert.isFalse(foundState, 'Empty entityID should return false');
		});

		it('should handle an empty token', () => {
			const foundState = stateStore.has(defaultState.entityID, '');
			assert.isFalse(foundState, 'Empty token should return false');
		});

		it('should handle call when nothing has been added', () => {
			const foundState = stateStore.has(defaultState.entityID, defaultState.token);
			assert.isFalse(foundState, 'Should not return anything if there are no states');
		});

		it('should not return a state if entityID does not match', () => {
			stateStore.add(defaultState);
			const foundState = stateStore.has('invalid', defaultState.token);
			assert.isFalse(foundState, 'EntityID should not match a state');
		});

		it('should not return a state if token does not match', () => {
			stateStore.add(defaultState);
			const foundState = stateStore.has(defaultState.entityID, 'invalid');
			assert.isFalse(foundState, 'Token should not match a state');
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

		it('should only match exact tokens', () => {
			stateStore.add(defaultState);
			const foundState = stateStore.has(defaultState.entityID, defaultState.token.toLowerCase());
			assert.isFalse(foundState, 'Token should be an exact match');
		});
	});

});
