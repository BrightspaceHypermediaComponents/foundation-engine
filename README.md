# foundation-engine

The powerhouse state and render engine behind [`@brightspace-hmc/foundation-components`](https://github.com/BrightspaceHypermediaComponents/foundation-components).

For information on how to use the engine to create new components, see [Creating New Components](https://github.com/BrightspaceHypermediaComponents/foundation-components/blob/master/creating-new-components.md).

## State Engine

`foundation-engine` generates a hypermedia state for each entity related to a component. The component defines what pieces of the state it needs to observe. If this piece changes, the engine will push the changes to the components observing. By allowing the component to define what it needs, this means the state engine is polymorphic &mdash; there is no need to pre-define entity state objects.

## Render Engine

The render portion of the engine resolves base tags to component tags based on the hypermedia `classes` property on the entity associated with the component.

## Developing, Testing and Contributing

After cloning the repo, run `npm install` to install dependencies.

### Testing

To lint:

```shell
npm run lint
```

To run local unit tests:

```shell
npm run test:headless
```

To run both linting and unit tests:

```shell
npm test
```

## Versioning & Releasing

> TL;DR: Commits prefixed with `fix:` and `feat:` will trigger patch and minor releases when merged to `master`. Read on for more details...

The [sematic-release GitHub Action](https://github.com/BrightspaceUI/actions/tree/master/semantic-release) is called from the `release.yml` GitHub Action workflow to handle version changes and releasing.

### Version Changes

All version changes should obey [semantic versioning](https://semver.org/) rules:
1. **MAJOR** version when you make incompatible API changes,
2. **MINOR** version when you add functionality in a backwards compatible manner, and
3. **PATCH** version when you make backwards compatible bug fixes.

The next version number will be determined from the commit messages since the previous release. Our semantic-release configuration uses the [Angular convention](https://github.com/conventional-changelog/conventional-changelog/tree/master/packages/conventional-changelog-angular) when analyzing commits:
* Commits which are prefixed with `fix:` or `perf:` will trigger a `patch` release. Example: `fix: validate input before using`
* Commits which are prefixed with `feat:` will trigger a `minor` release. Example: `feat: add toggle() method`
* To trigger a MAJOR release, include `BREAKING CHANGE:` with a space or two newlines in the footer of the commit message
* Other suggested prefixes which will **NOT** trigger a release: `build:`, `ci:`, `docs:`, `style:`, `refactor:` and `test:`. Example: `docs: adding README for new component`

To revert a change, add the `revert:` prefix to the original commit message. This will cause the reverted change to be omitted from the release notes. Example: `revert: fix: validate input before using`.

### Releases

When a release is triggered, it will:
* Update the version in `package.json`
* Tag the commit
* Create a GitHub release (including release notes)

### Releasing from Maintenance Branches

Occasionally you'll want to backport a feature or bug fix to an older release. `semantic-release` refers to these as [maintenance branches](https://semantic-release.gitbook.io/semantic-release/usage/workflow-configuration#maintenance-branches).

Maintenance branch names should be of the form: `+([0-9])?(.{+([0-9]),x}).x`.

Regular expressions are complicated, but this essentially means branch names should look like:
* `1.15.x` for patch releases on top of the `1.15` release (after version `1.16` exists)
* `2.x` for feature releases on top of the `2` release (after version `3` exists)
