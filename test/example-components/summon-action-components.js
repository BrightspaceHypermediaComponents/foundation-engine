import { HypermediaStateMixin } from '../../framework/lit/HypermediaStateMixin.js';
import { LitElement } from 'lit-element';
import { observableTypes } from '../../state/HypermediaState.js';

class SummonActionComponent extends HypermediaStateMixin(LitElement) {
	static get properties() {
		return {
			exampleSummon: { type: Object, observable: observableTypes.summonAction, name: 'example-summon' }
		};
	}

	async getSummonedThing(observables, bypassCache) {
		if (this._hasAction('exampleSummon')) {
			this.summonedEntity = await this.exampleSummon.summon(observables, bypassCache);
		}
	}
}
customElements.define('summon-action-component', SummonActionComponent);

class SummonActionRoutedActionComponent extends HypermediaStateMixin(LitElement) {
	static get properties() {
		return {
			exampleAction: { observable: observableTypes.action, name: 'example-action',
				route: [{ observable: observableTypes.summonAction, name: 'example-summon' }] }
		};
	}
}
customElements.define('summon-action-routed-action-component', SummonActionRoutedActionComponent);

class SummonActionRoutedSummonActionComponent extends HypermediaStateMixin(LitElement) {
	static get properties() {
		return {
			nestedSummon: { observable: observableTypes.summonAction, name: 'example-nested-summon',
				route: [{ observable: observableTypes.summonAction, name: 'example-summon' }] }
		};
	}
}
customElements.define('summon-action-routed-summon-action-component', SummonActionRoutedSummonActionComponent);
