import { HypermediaStateMixin } from '../../framework/lit/HypermediaStateMixin.js';
import { LitElement } from 'lit-element';
import { observableTypes } from '../../state/HypermediaState.js';

class SubEntitiesComponent extends HypermediaStateMixin(LitElement) {
	static get properties() {
		return {
			items: { observable: observableTypes.subEntities, rel: 'item' }
		};
	}

	async updateItems(items) {
		this._state.updateProperties({
			items: {
				observable: observableTypes.subEntities,
				rel: 'item',
				value: items
			}
		});
	}
}
customElements.define('subentities-component', SubEntitiesComponent);

class RoutedSubEntitiesComponent extends HypermediaStateMixin(LitElement) {
	static get properties() {
		return {
			items: { observable: observableTypes.subEntities, rel: 'item', route: [
				{ observable: observableTypes.link, rel: 'linked' }
			] }
		};
	}

	async updateItems(items) {
		this._state.updateProperties({
			items: {
				observable: observableTypes.subEntities,
				rel: 'item',
				value: items,
				route: [
					{ observable: observableTypes.link, rel: 'linked' }
				]
			}
		});
	}
}
customElements.define('routed-subentities-component', RoutedSubEntitiesComponent);
