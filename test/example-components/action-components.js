import { HypermediaStateMixin } from '../../framework/lit/HypermediaStateMixin.js';
import { LitElement } from 'lit-element';
import { observableTypes } from '../../state/HypermediaState.js';

class ActionComponent extends HypermediaStateMixin(LitElement) {
	static get properties() {
		return {
			exampleAction: { observable: observableTypes.action, name: 'example-action' }
		};
	}
}
customElements.define('action-component', ActionComponent);
