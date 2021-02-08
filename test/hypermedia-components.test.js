import { assert }  from '@open-wc/testing';
//import { html } from '../src/framework/hypermedia-components.js';
import { componentStoreFactory } from '../render/componentFactory.js';
//import sinon from 'sinon/pkg/sinon-esm.js';

describe('Component Store', () => {

	it('should register d2l-activity-name for customHypermediaElement', async() => {
		window.D2L = window.D2L || {};
		window.D2L.ComponentStore = new Map();

		const pseudoTag = 'd2l-activity-name';
		const components = componentStoreFactory(pseudoTag);

		let tag = 'd2l-activity-name-learning-path';
		let hypermediaClasses = [['activity-usage', 'course-offering']];
		components.register(tag, hypermediaClasses);

		tag = 'd2l-activity-name-learning-path2';
		hypermediaClasses = [['activity-usage', 'learning-path']];
		components.register(tag, hypermediaClasses);

		const component = window.D2L.ComponentStore.get(pseudoTag);
		const getElementPseudoTag = component._elementPseudoTag;
		const getLearningPath = component._componentStore.get('activity-usage').get('course-offering').get(null);
		const getLearningPath2 = component._componentStore.get('activity-usage').get('learning-path').get(null);

		assert(getElementPseudoTag === 'd2l-activity-name');
		assert(getLearningPath === 'd2l-activity-name-learning-path');
		assert(getLearningPath2 === 'd2l-activity-name-learning-path2');
	});

	it('should successfully return the component tag', async() => {
		const pseudoTag = 'd2l-activity-name';
		const component = window.D2L.ComponentStore.get(pseudoTag);

		let classes = ['activity-usage', 'course-offering'];
		let componentTag = component.componentTag(classes);
		assert(componentTag === 'd2l-activity-name-learning-path');

		classes = ['activity-usage', 'learning-path'];
		componentTag = component.componentTag(classes);
		assert(componentTag === 'd2l-activity-name-learning-path2');

	});

	/*it('should proprely generate proper html DOM', async () => {

		const sandbox = sinon.createSandbox();

		sandbox.stub(window.d2lfetch, 'fetch').callsFake(() => {
			const whatToFetch = {
				"class": [
				  "activity-usage",
				  "learning-path"
				],
				"links": [
				  {
					"rel": [
					  "https://activities.api.brightspace.com/rels/activity-usage",
					  "self"
					],
					"href": "../data/learning-path-activity-usage.json"
				  },
				  {
					"rel": [
					  "https://activities.api.brightspace.com/rels/user-activity-usage",
					  "https://activities.api.brightspace.com/rels/my-activity-usage"
					],
					"href": "https://activities.api.proddev.d2l/activities/6606_706000_6607/usages/6607/users/169"
				  },
				  {
					"rel": [
					  "https://activities.api.brightspace.com/rels/activity-collection"
					],
					"href": "../data/collection.json"
				  },
				  {
					"rel": [
					  "https://api.brightspace.com/rels/organization",
					  "https://api.brightspace.com/rels/specialization"
					],
					"href": "../data/organization.json"
				  },
				  {
					"rel": [
					  "alternate"
					],
					"type": "text/html",
					"href": "http://127.0.0.1:8081/components/d2l-activities/demo/d2l-activity-admin-list/d2l-activity-admin-list-demo.html"
				  },
				  {
					"rel": [
					  "edit"
					],
					"type": "text/html",
					"href": "http://127.0.0.1:8081/components/d2l-activities/demo/d2l-activity-collection-editor/d2l-activity-collection-editor-demo.html"
				  }
				],
				"actions": [
				  {
					"href": "https://organizations.api.proddev.d2l/123059",
					"name": "update-draft",
					"method": "PATCH",
					"fields": [
					  {
						"type": "checkbox",
						"name": "draft",
						"value": true
					  }
					]
				  }
				]
			  }

			return Promise.resolve({
				ok: true,
				json: () => { return Promise.resolve(whatToFetch); }
			});
		});

		const href = './data/learning-path-activity-usage.json';
		const token ='secret';
		const normalFixure =  await html`<d2l-activity-name href="${href}" .token="${token}"></d2l-activity-name>`
		console.log(normalFixure);
	});*/

});
