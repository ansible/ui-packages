# Package release ownership

Each package has one release status. The previously published UI packages keep
their current versions and release history, but this repository does not plan
future releases for them. The future migrated packages use Changesets. Keep the
sets below disjoint and assign a package before merging its directory.

| Package                          | Release owner | Version and release behavior                                                     |
| -------------------------------- | ------------- | -------------------------------------------------------------------------------- |
| `@ansible/ui-plugin-loader`      | None          | Keep the published package and changelog; no future release is scheduled         |
| `@ansible/ui-plugin-pf5`         | None          | Keep the published package and changelog; no future release is scheduled         |
| `@ansible/ui-plugin-sdk`         | None          | Keep the published package and changelog; no future release is scheduled         |
| `@ansible/eslint-plugin`         | Changesets    | Independent versions; changeset file; npm publish and per-package GitHub Release |
| `@ansible/md-link-lint`          | Changesets    | Independent versions; changeset file; npm publish and per-package GitHub Release |
| `@ansible/ui-plugin-example-pf5` | None          | Example workspace; not published                                                 |

Nx remains the task runner for workspace scripts and affected CI. Its release
configuration and the old publish workflow are removed. Existing npm packages,
package manifests, changelogs, and GitHub releases remain in place; this change
does not unpublish or rewrite them.

Changesets ignores the existing UI packages and the example workspace in
`.changeset/config.json`. It is configured for public, independent releases on
`main`, with patch updates to internal dependency ranges. The Changesets
workflow creates a version pull request and publishes changes when it merges.
It creates a package tag and GitHub Release for each published migrated
package.

The repository must allow GitHub Actions to create pull requests and provide an
`NPM_ACCESS_TOKEN` secret for publishing. The workflow requests the permissions
needed for GitHub releases, pull requests, and npm provenance.

Before adding any package directory, assign it to exactly one row in this
table. Keep the Changesets ignore list aligned with the no-release packages.
Add a changeset for every release-worthy change to a Changesets-owned package.
Conventional Commit messages remain the repository commit format, but do not
schedule package releases.
