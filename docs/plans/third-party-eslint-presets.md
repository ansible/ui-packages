# Plan: Third-Party ESLint Presets

## Goal

Expose useful upstream TypeScript ESLint rules through named, opt-in flat
configs in `@ansible/eslint-plugin`. Keep the existing `recommended` config
unchanged and keep upstream rules under their original names.

## Proposed configs

- `typescript-naming`: configure
  `@typescript-eslint/naming-convention` to allow camel case or uppercase
  variable names and require uppercase names for `const` variables. This is a
  strict convention, so consumers opt in deliberately.
- `typescript-type-safety`: enable
  `@typescript-eslint/no-unsafe-type-assertion` to flag narrowing type
  assertions. This does not replace runtime validation for untrusted input.

Both configs should apply only to TypeScript file extensions and stay separate
from `recommended`. They rely on the consumer's `typescript-eslint` parser,
plugin registration, and type-aware lint setup.

## Work steps

1. Add the two named configs to the existing `plugin.configs` export. Configure
   upstream rule IDs directly; do not create duplicate Ansible rules or bundle
   a second copy of `typescript-eslint` into the plugin.
2. Declare `typescript-eslint` as an optional peer, since only users of these
   configs need it. Document its installation, typed preset composition, and
   `parserOptions.projectService` setup in the README.
3. Update the existing config-export expectations and add focused integration
   coverage for both presets. Confirm `recommended` still enables only the
   existing Ansible rules.
4. Add a package release note with `npm run changesets:add`.
5. Run the plugin test suite and repository static checks.
6. Commit the plugin, docs, tests, and release note with the required
   attribution trailers, then push the current branch so its existing PR is
   updated.

## Packaging decision

Use the current `@ansible/eslint-plugin` package and its named config export;
do not create a separate config package unless dependency isolation becomes a
requirement. Consumers compose the selected config after their
`typescript-eslint` typed config.
