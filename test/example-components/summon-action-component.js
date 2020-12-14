import { HypermediaStateMixin } from '../../framework/lit/HypermediaStateMixin.js';
import { LitElement } from 'lit-element';
import { observableTypes } from '../../state/HypermediaState.js';

class SummonActionComponent extends HypermediaStateMixin(LitElement) {
	static get properties() {
		return {
			exampleSummon: { type: Object, observable: observableTypes.summonAction, name: 'example-summon' }
		};
	}

	async getSummonedThing() {
		if (this._hasAction('exampleSummon')) {
			this.summonedEntity = await this.exampleSummon.summon();
		}
	}
}

customElements.define('summon-action-component', SummonActionComponent);
