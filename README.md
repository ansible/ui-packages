# Ansible UI Packages

Monorepo containing public npm packages and developer tools from the Red Hat Ansible UI team.

Packages are in the `packages` directory.

The root of the project is generic containing shared configurations,
and uses npm workspaces to automate scripts across workspaces.

## Getting Started

1. Prerequisites

   - Node `22.23.4` or later in the 22.x line, or `24.x` and up (23.x is not supported)
   - NPM `8.x` and up

2. Clone Repository

   ```
   git clone git@github.com:ansible/ui-packages.git
   ```

3. Install Package Dependencies

   ```
   npm ci
   ```

4. Run tests

   ```
   npm test
   ```

## Development

### Packages

Packages are in the `packages` directory.

When working with NPM packages, the packages can only be used by other packages after they have been built.

We are using NX to manage the repo.
NX supports having tasks depend on other tasks.
Using this functionality, the `test` task and depends on the `build` task.
The guarentees that the `build` happens before `test` which is important as the packages need to be built before they are used.

There is a top level `watch` that should be used to keep package builds up-to-date while working with them.

```
npm run watch
```

### Examples

Examples are in the `examples` directory.

To run an example, change the the example directory and run `npm start`.

```
cd examples/ui-plugin-example-pf5
npm start
```

### Releases

See [RELEASING.md](RELEASING.md) for package ownership and release instructions. The existing UI packages keep their published versions and release history; this repository no longer schedules releases for them. Future migrated packages use Changesets and require a changeset file for each release-worthy change.

### Conventional Commits

Use [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) for repository commits. Commit type does not schedule a package release; Changesets files control releases for migrated packages.
