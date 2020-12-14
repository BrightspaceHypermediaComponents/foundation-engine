# Observables

Observables are special properties defined by `foundation-components` that are **stateful** &mdash; they respond to changes on the state built from the Siren Hypermedia response.

## Types of observables

|Name|Type|Description|
|---|---|---|
|Classes|`Array`|A list of classes associated with the target|
|Link|`String`|A link to another entity related to the target in the `links` array in the Siren response|
|Property|`String`|A property attached to the target|
|SubEntity|`Object`|An object representation of an entity attached to the target in the `entities` Siren response|
|SubEntities|`Array`|An array of subEntity objects with the same `rel`|
|Action|`Object`|An action that can commit changes to the state|
|SummonAction|`Object`|A special action that when performed, returns an another entity. Used for workflow actions that do not make changes to the target|
|Entity **(dev only)**|`Object`|A full object representation of the target|

## Parameters

|Name|Type|Description|
|---|---|---|
|`observable` (required)|`Number`|One of the [observableTypes](sirenObservableFactory.js) defined in the observable factory|
|`rel`|`String`|If relevant, what `rel` to get the item from. Only applicable to `Routable` observables.
|`id`|`String`|What the observable is called in the Siren entity object - if not passed, default is the name of the property with or without an underscore|
|`route`|`Array`|Route to the observable through the given array of observables (see below)|
|`prime`|`Boolean`|Pre-fetch and cache the observable (see below)|

## Routing and Priming

### Route

**Example:** The following will observe a property routed to through three nested entities.

```js
orgUnit: {
  type: String,
  observable: observableTypes.property,
  route: [{
    observable: observableTypes.link,
    rel: 'https://api.brightspace.com/rels/assignment'
  }, {
    observable: observableTypes.subEntity,
    rel: 'https://assignments.api.brightspace.com/rels/instructions'
  }, {
    observable: observableTypes.subEntity,
    rel: 'https://api.brightspace.com/rels/richtext-editor-config'
  }]
}
```

Observables can be passed the `route` parameter in order to step through the Siren Hypermedia tree. Adding the `route` parameter to a routable observable will fetch the relevant entity if needed and create an observable on that entity. The component is then added as an observable to that routed entity.

- `Link`: fetches the entity and returns the observable
- `SubEntity`: fetches the entity if needed and returns the observable
- `SubEntities`: fetches the entities if needed and returns an array of the observed items
- `SummonAction`: calls `summon` to get the entity

Routing can be used to dig as far into the tree as necessary by adding items to the array.

### Prime

The `prime` parameter will fetch the relevant observable when the component first loads and place it in the `StateStore`. This is useful for linked entities that are needed when the component loads instead of passing the baton to a sub-component, or to fetch more information on a `subEntity`.

- `Link`: fetches the entity
- `SubEntity`: fetches the entity if needed &mdash; some subEntities are only partially fetched when the target loads, thus adding `prime` will perform a full fetch
- `SubEntities`: similar to `SubEntity`, except will perform multiple fetches if needed
- `SummonAction`: calls `summon` to get the entity

