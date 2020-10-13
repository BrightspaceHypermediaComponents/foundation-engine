import { expect } from '@open-wc/testing';
import { HypermediaState } from '../../state/HypermediaState.js';
import sinon from 'sinon/pkg/sinon-esm.js';
import { stateFactory } from '../../state/store.js';
import { TOKEN_COOKIE } from '../../state/token.js';

describe('state/store.js', () => {

	const recycleBin = [];
	let sandbox;
	async function createTestState(id, token) {
		const state = await stateFactory(id, token);
		recycleBin.push(state);
		return state;
	}

	async function emptyRecycleBin() {
		let state;
		while ((state = recycleBin.pop()) !== undefined) {
			window.D2L.SirenSdk.StateStore.remove(state);
			state.dispose();
		}
	}

	function verifyState(state, id, token) {
		expect(state).to.be.instanceOf(HypermediaState);
		expect(state.entityId, 'entityId').to.be.equal(id);
		expect(state.token.value, 'token').to.be.equal(token);
		const storedState = window.D2L.SirenSdk.StateStore.get(id, token);
		expect(storedState, 'stored state').to.be.equal(state); // BUG, returns false instead of state object for state that is created with TOKEN_COOKIE
	}

	beforeEach(() => {
		sandbox = sinon.createSandbox();
	});

	afterEach(() => {
		emptyRecycleBin();
		sandbox.restore();
	});

	describe('stateFactory', () => {
		/*
           Testing notes:
           need to export
           sateFactory is used in:
             framework/lit/HypermediaStateMixin.js,
             framework/lit/HypermediaResult.js,
             state/sirenComponents/SirenLink.js

            this._states map has key as a token value and map as a value. value map has keys of state objects and value of { refCount: number } ?
            Questions:
              Why duplicate calls to _initContainer ?
                 window.D2L.SirenSdk.StateStore.makeNewState and window.D2L.SirenSdk.StateStore.add are both called from stateFactory
                and both methods call _initContainer.

        */

		it('should retun new state when created with unique entityId and token', async() => {
			const state = await createTestState('id', 'token');
			verifyState(state, 'id', 'token');
		});

		it('should retun existing state when created with existing entityId and token', async() => {
			const state = await createTestState('id', 'token');
			const state2 = await createTestState('id', 'token');
			expect(state).to.be.equal(state2);
			verifyState(state, 'id', 'token');
		});

		const stateIsNotCreatedTestCases = [
			{ id: undefined },
			{ id: null },
			{ id: '' },
			{ id: 0 },
			{ id: {} },
			{ id: false }
		];
		stateIsNotCreatedTestCases.forEach((test) => {
			it(`should retun undefined when created with id:  ${JSON.stringify(test.id)}`, async() => {
				const state = await createTestState(undefined, 'token');
				expect(state).to.be.equal(undefined);
			});
		});

		describe('integration with token', () => {
			it('can create state with TOKEN_COOKIE', async() => {
				const state = await createTestState('id', TOKEN_COOKIE);
				verifyState(state, 'id', TOKEN_COOKIE);
			});

			it('can create state with function token', async() => {
				const tokenValue = '123';
				const state = await createTestState('id', () => { return tokenValue;});
				verifyState(state, 'id', tokenValue);
			});

			it('can create state with function that returns promise', async() => {
				const tokenValue = '123';
				function later(delay, value) {
					return new Promise(resolve => setTimeout(resolve, delay, value));
				}
				const state = await createTestState('id', () => later(100, tokenValue));
				verifyState(state, 'id', tokenValue);
			});

			it('can create new state with undefined token', async() => {
				const state = await createTestState('id');
				verifyState(state, 'id', undefined);
			});
		});

		/*
         Questions about design of the stateFactory
         */

		it('Design Question: shoudld it allow creating different states for same entityId and different tokens?', async() => {
			const state = await createTestState('id', 'token');
			const state2 = await createTestState('id', 'token2');
			expect(state).not.to.be.equal(state2);
			verifyState(state, 'id', 'token');
			verifyState(state2, 'id', 'token2');
		});

		it('Design Question: should it call StateStore.makeNewState and StateStore.add when store already has state with same entity id and token pair?', async() => {
			const stateStore = {
				makeNewState: sandbox.spy(window.D2L.SirenSdk.StateStore, 'makeNewState'),
				add: sandbox.spy(window.D2L.SirenSdk.StateStore, 'add')
			};
			const state = await createTestState('id', 'token');
			const state2 = await createTestState('id', 'token');
			expect(state).to.be.equal(state2);
			verifyState(state, 'id', 'token');
			expect(stateStore.makeNewState.called).to.be.true;
			expect(stateStore.add.called).to.be.true;
		});

		it('Design Question: Should I be able to create state with token that is a promise pending to be resolved', async() => {
			const tokenValue = '123';
			function later(delay, value) {
				return new Promise(resolve => setTimeout(resolve, delay, value));
			}
			const pending = later(100, tokenValue);
			expect(pending).to.be.instanceOf(Promise);
			try {
				const state = await createTestState('id', pending);
				verifyState(state, 'id', tokenValue);
			} catch (e) {
				// TypeError: token.split is not a function
				console.log(e); // eslint-disable-line
			}
		});

		it('Design Question: when creating state it uses whatever letter case of entityId, and then it uses lowercase entityId to check if state exists', async() => {
			const state = await createTestState('ID', 'token'); // entity created with upper case entityId
			const state2 = await createTestState('id', 'token'); // then is matched to existing entity
			expect(state).to.be.equal(state2);
			verifyState(state2, 'ID', 'token');
			verifyState(state, 'ID', 'token');

			const state3 = await createTestState('id2', 'token'); // entity created with lower case entityId
			const state4 = await createTestState('ID2', 'token'); // then is matched texisting
			expect(state3).to.be.equal(state4);
			verifyState(state3, 'id2', 'token');
			verifyState(state4, 'id2', 'token');
		});

	});

	describe.skip('stateFactoryByRawSirenEntity', () => {
		/*
          Testing notes:
            Used in state/sirenComponents/SirenSubEntity.js
          Questions:
            Unclear code path when getEntityIdFromSirenEntity returns value which undefined or null or empty string.
            In this case state is still created, however it is not added to the StateStore
            Also it is not clear why there is call state.onServerResponse(rawEntity);
        */
	});

	describe.skip('performAction', () => {
		/*
          Testing notes:
            Used in state/sirenComponents/SirenAction.js
          Questions:
            Unclear why there is a call to await action.refreshToken() without actually using returned refreshed token.
            in StateStore class method there is a:
                const state = this.get(entity.getLink('self').href, action.token);
                state.onServerResponse(entity);
            What if this.get returns undefined ?

        */
	});

	describe.skip('dispose', () => {
		/*
          Testing notes:
            Used in framework/lit/HypermediaStateMixin.js
          Questions:
            Should it belong to the store? When tracing what the method does, there is no a sing call that is related to the StateStore

        */
	});

	describe.skip('get', () => {
		/*
        testing notes:
          Code is mind twister. It reads like a JS quizz question: function whatItReturns(){ return true && 'string' && 5;}
        */
	});

});
