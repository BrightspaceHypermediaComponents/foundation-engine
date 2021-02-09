import { HypermediaStateMixin } from '../../framework/lit/HypermediaStateMixin.js';
import { LitElement } from 'lit-element';
import { observableTypes } from '../../state/HypermediaState.js';

function uniqueId() {
	return Math.floor(Math.random() * 10000);
}

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

class SubEntitiesComponentModifiedList extends HypermediaStateMixin(LitElement) {
	static get properties() {
		return {
			items: {
				observable: observableTypes.subEntities,
				rel: 'item',
				method: (items) => {
					const unqiueId = uniqueId();
					items.forEach(item => item.properties.itemNumber = unqiueId + item.properties.itemNumber);
					return items;
				}
			}
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
customElements.define('subentities-component-modified-list', SubEntitiesComponentModifiedList);
