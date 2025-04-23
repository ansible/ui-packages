# Ansible UI Packages

Mono repo containing all the public NPM packages developed by the Red Hat Ansible UI team.

Packages are in the `packages` directory.

The root of the project is generic containing shared configurations,
and uses npm workspaces to automate scripts across workspaces.

## Getting Started

1. Prerequisites

   - Node 20.x and up
   - NPM 8.x and up

2. Clone Repository

   ```
   git clone git@github.com:ansible/ui-packages.git
   ```

3. Install Package Dependencies

   ```
   npm ci
   ```

## Running Tests

Tests for all the packages can be run from the CLI using

```
npm test
```

## Working with a specific packages

Change to the directory containing the package you are interested in.

```
cd packages/some-package
npm test
```

## Conventions

All commit messages should have a [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) formatted commit.