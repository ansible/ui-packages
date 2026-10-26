# Package release ownership

Each package has one release status. The previously published UI packages keep
their current versions and release history, but this repository does not plan
future releases for them. Packages added later use Changesets for versioning.
Keep the sets below disjoint and assign a package before merging its directory.

| Package                          | Release owner | Version and release behavior                                |
| -------------------------------- | ------------- | ----------------------------------------------------------- |
| `@ansible/ui-plugin-loader`      | None          | Keep the published package and changelog; no future release |
| `@ansible/ui-plugin-pf5`         | None          | Keep the published package and changelog; no future release |
| `@ansible/ui-plugin-sdk`         | None          | Keep the published package and changelog; no future release |
| `@ansible/eslint-plugin`         | Changesets    | Independent version PRs; npm publish on merge               |
| `@ansible/md-link-lint`          | Changesets    | Independent version PRs; npm publish on merge               |
| `@ansible/ui-plugin-example-pf5` | None          | Example workspace; not published                            |

Nx remains the task runner for workspace scripts and affected CI. Its release
configuration and the old publish workflow are removed. Existing npm packages,
package manifests, changelogs, and GitHub releases remain in place; this change
does not unpublish or rewrite them.

Changesets ignores the existing UI packages and the example workspace in
`.changeset/config.json`. It is configured for public, independent versions on
`main`, with patch updates to internal dependency ranges. The workflow creates a
version pull request for Changesets-owned packages. After a version pull request
merges, the standard Changesets action runs `changeset publish`, pushes a git
tag, and creates a GitHub Release for each package it publishes. npm publishing
uses the repository Actions secret `NPM_TOKEN`. Configure the secret before
merging the first version pull request. If the secret is missing or invalid,
npm publishing will fail. Do not put token values in repository files.

The version workflow needs GitHub Actions permission to create pull requests.
It uses the GitHub API to create version commits, which receive a verified
GitHub signature.

Before adding any package directory, assign it to exactly one row in this
table. Keep the Changesets ignore list aligned with the no-release packages.
Add a changeset for every version-worthy change to a Changesets-owned package.
Conventional Commit messages remain the repository commit format, but do not
schedule package releases.
