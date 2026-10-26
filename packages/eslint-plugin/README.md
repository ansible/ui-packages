# `@ansible/eslint-plugin`

Portable custom ESLint rules for Ansible frontend packages.

The npm install command below works after the first Changesets version PR is
merged and published.

## Install

```bash
npm install --save-dev @ansible/eslint-plugin eslint@^10
```

## Use

```js
// eslint.config.js
import ansible from '@ansible/eslint-plugin'

export default [...ansible.configs.recommended]
```

For TypeScript and JSX, install `typescript-eslint` and compose its parser
config before this package's rules:

```js
import tseslint from 'typescript-eslint'
import ansible from '@ansible/eslint-plugin'

export default [...tseslint.configs.recommended, ...ansible.configs.recommended]
```

This package provides custom rules only and does not configure a TypeScript
parser itself.

To require descriptive JSDoc for named functions, opt in to the separate
`documented-functions` config:

```js
export default [...ansible.configs.recommended, ...ansible.configs['documented-functions']]
```

The rule requires explanatory prose and allows tags such as `@param` and
`@returns`, which can carry type information in JavaScript. To report tags that
repeat TypeScript signature types, set `allowTypeTags` to `false` in a rule
override after the `documented-functions` config:

```js
{
  rules: {
    "@ansible/require-function-jsdoc": ["error", { allowTypeTags: false }],
  },
}
```

Inline callbacks are not required to have their own descriptions.

## Compatibility

The declared Node engine range is `^22.23.4 || >=24`.

| Requirement | Supported range           | CI coverage                           |
| ----------- | ------------------------- | ------------------------------------- |
| Node.js     | `>=22.23.4 <23` or `>=24` | Node `22.23.4` and latest `24.x`      |
| ESLint      | `^10.0.0`                 | `10.11.0` from the workspace lockfile |

The TypeScript parser is consumer-provided and is not part of this package's
compatibility matrix. The plugin test suite exercises JavaScript with ESLint's
default parser and TypeScript with the workspace's `@typescript-eslint/parser`.

## Rules

- `@ansible/no-barrel-files`: disallows modules that only forward exports from
  other modules. This rule is enabled in this repository's lint configuration,
  not in the plugin's recommended config.
- `@ansible/no-nested-component-definitions`: reports React function component
  definitions inside a component or hook body, which give the component a new
  identity on every render. Move them to module scope and pass data as props.
  Factory functions such as higher-order components build their inner component
  once per call, so they are left alone.
- `@ansible/require-function-jsdoc`: requires a short description for named
  functions. It is enabled only by the opt-in `documented-functions` config.

### Test files

Local component wrappers are idiomatic in tests, so `recommended` turns
`no-nested-component-definitions` off for `*.{test,spec}.*` files and for
`__tests__`, `__mocks__`, `test`, `tests`, and `test-utils` directories. These
are ordinary flat-config globs resolved against your project root, so override
them like any other config entry:

```js
export default [
  ...ansible.configs.recommended,
  {
    files: ['tests/**'],
    rules: { '@ansible/no-nested-component-definitions': 'error' },
  },
]
```
