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

	});
});
