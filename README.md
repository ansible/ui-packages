# Ansible UI Packages

Mono repo containing all the public NPM packages developed by the Red Hat Ansible UI team.

Packages are in the `packages` directory.

The root of the project is generic containing shared configurations,
and uses npm workspaces to automate scripts across workspaces.

## Getting Started

1. Prerequisites

   - Node `20.x` and up
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

### Conventions

All commit messages should have a [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) formatted commit. This allows `nx` to generate release notes and automatically increment the version and publish the packages.

|             Name | Description                                   |
| ---------------: | --------------------------------------------- |
| BREAKING CHANGE: | Increments the `MAJOR` in Semantic Versioning |
|            feat: | Increments the `MINOR` in Semantic Versioning |
|             fix: | Increments the `PATCH` in Semantic Versioning |
|           build: | Build                                         |
|           chore: | Chores                                        |
|              ci: | CICD                                          |
|            docs: | Docs                                          |
|           style: | Styling                                       |
|        refactor: | Refactoring                                   |
|            test: | Tests                                         |
|            perf: | Performance                                   |
