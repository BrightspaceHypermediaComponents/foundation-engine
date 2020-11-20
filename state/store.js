import 'd2l-fetch/d2l-fetch.js';

export async function refreshState(state, refetch = true) {
	await state.refreshToken();
	return window.D2L.SirenSdk.StateStore.fetch(state, refetch);
}

export async function dispose(state, component) {
	state && state.dispose(component);
}
