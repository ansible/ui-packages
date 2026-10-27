# `@ansible/eslint-plugin`

Portable custom ESLint rules for Ansible frontend packages.

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

## Opt-in application checks

Application-specific checks are separate flat configs. They are not included in
recommended, so consumers can enable only the conventions their projects use.

```js
export default [
  ...ansible.configs.recommended,
  ...ansible.configs['api-paths'],
  ...ansible.configs['documentation-links'],
  ...ansible.configs['http-client-policy'],
  {
    rules: {
      '@ansible/no-hardcoded-api-prefix': ['error', { roots: { '/api/v3': 'platformApi' } }],
      '@ansible/no-hardcoded-doc-urls': ['error', { prefixes: ['https://docs.example.com/'] }],
    },
  },
]
```

The API and documentation rules have no built-in roots or URL prefixes. Set
these options for your project. Without them, the rules report nothing. The
configs skip common test files; leave a config out or add a later flat-config
override to opt out for a project or file group.

### API paths

The api-paths config checks string literals and template segments for roots
supplied in the roots option. It reports a match only when the configured root
ends at a path boundary.

```js
{
  files: ['packages/standalone-api/**'],
  rules: { '@ansible/no-hardcoded-api-prefix': 'off' },
}
```

### Documentation links

The documentation-links config checks strings that start with one of the
prefixes supplied in the prefixes option. It checks a template with a fixed
documentation origin and leaves prose with an embedded Markdown link alone.

### HTTP client policy

The http-client-policy config checks imports from common HTTP-client packages,
including axios, cross-fetch, got, ky, node-fetch, ofetch, superagent, and
undici. Set clientModules to the HTTP-client packages your project wants checked
and allow shared clients with approvedModules.

```js
export default [
  ...ansible.configs['http-client-policy'],
  {
    rules: {
      '@ansible/no-unapproved-http-client': [
        'error',
        {
          clientModules: ['axios', '@ansible/api-client'],
          approvedModules: ['@ansible/api-client'],
          disallowFetch: true,
        },
      ],
    },
  },
]
```

Global fetch and XMLHttpRequest are allowed by default. Enable disallowFetch
or disallowXMLHttpRequest to check those browser APIs too.

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
- `@ansible/no-hardcoded-api-prefix`: reports configured API roots in string
  literals and template strings so requests can use a shared API client.
- `@ansible/no-hardcoded-doc-urls`: reports configured documentation URLs at the
  start of string values so projects can use a shared link helper.
- `@ansible/no-unapproved-http-client`: reports imports from common HTTP-client
  packages unless they appear in approvedModules. Direct fetch and
  XMLHttpRequest checks are separately controlled by disallowFetch and
  disallowXMLHttpRequest, and the rule is enabled only by http-client-policy.
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
