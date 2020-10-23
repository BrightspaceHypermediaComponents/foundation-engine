import { expect }  from '@open-wc/testing';
import { HypermediaState } from '../state/HypermediaState.js';
import sinon from 'sinon/pkg/sinon-esm.js';
import { stateFactory } from '../state/store.js';

describe('StateFactory', () => {

	const recycleBin = [];
	let sandbox;
	async function createTestState(objParam, token) {
		const state = await stateFactory(objParam, token);
		recycleBin.push(state);
		return state;
	}

	async function emptyRecycleBin() {
		window.D2L.SirenSdk.StateStore.states = new Map();
	}

	function verifyState(state, id, token) {
		expect(state).to.be.instanceOf(HypermediaState);
		expect(state.entityId, 'entityId').to.be.equal(id);
		expect(state.token.value, 'token').to.be.equal(token);
		const storedState = window.D2L.SirenSdk.StateStore.states[token.toString()][id];
		expect(storedState, 'stored state').to.be.equal(state);
	}

	beforeEach(() => {
		sandbox = sinon.createSandbox();
	});

	afterEach(() => {
		emptyRecycleBin();
		sandbox.restore();
	});

	it('should retun new state when created with unique entityId and token', async() => {
		const state = await createTestState('id', 'token');
		verifyState(state, 'id', 'token');
	});

	it('should retun existing state when created with existing entityId and token', async() => {
		const stateStore = {
			makeNewState: sandbox.spy(window.D2L.SirenSdk.StateStore, 'makeNewState'),
			add: sandbox.spy(window.D2L.SirenSdk.StateStore, 'add')
		};
		await createTestState('id', 'token');
		await createTestState('id', 'token');
		expect(stateStore.makeNewState.callCount).to.be.equal(1);
		expect(stateStore.add.callCount).to.be.equal(1);
	});

});
