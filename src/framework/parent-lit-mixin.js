import { componentStoreFactory } from '../render/componentFactory.js';

/**
 * @export
 * @polymerMixin
 **/
export const ParentLitMixin = superclass => class extends superclass {
	constructor() {
		super();
		this.__childComponents = componentStoreFactory(this.constructor);
		Object.keys(this.constructor.components).forEach(index => {
			const componentObject = typeof this.constructor.components[index] === 'object'
				? this.constructor.components[index]
				: { component: this.constructor.components[index] };

			const component = componentObject.component;
			const type = componentObject.type ? componentObject.type : index;
			this.__childComponents.register(type, component);
			if (componentObject.default) {
				this.__childComponents.registerDefault(component);
			}
		});
	}

	_renderComponent(types, params) {
		const method = this.__childComponents.component(types);
		return method && method(params);
	}
};
