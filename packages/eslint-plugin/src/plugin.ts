import type { ESLint, Linter } from 'eslint'
import { createRequire } from 'node:module'

import noBarrelFiles from './rules/no-barrel-files.ts'
import noNestedComponentDefinitions from './rules/no-nested-component-definitions.ts'
import requireFunctionJsdoc from './rules/require-function-jsdoc.ts'

export { noBarrelFiles, noNestedComponentDefinitions, requireFunctionJsdoc }

// Read the version rather than repeating it, so a Changeset release cannot
// leave `meta.version` behind. `src` and `dist` are both one level below the
// package root, so the path holds before and after a build.
const { version } = createRequire(import.meta.url)('../package.json') as { version: string }

export const rules = {
  'no-barrel-files': noBarrelFiles,
  'no-nested-component-definitions': noNestedComponentDefinitions,
  'require-function-jsdoc': requireFunctionJsdoc,
}

const plugin = {
  meta: {
    name: '@ansible/eslint-plugin',
    version,
  },
  rules,
  configs: {},
} as unknown as ESLint.Plugin & {
  configs: Record<string, Linter.Config[]>
}

export default plugin

const sourceFiles = ['**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}']

// Local wrappers are idiomatic in tests, so the component rule is scoped off
// there. ESLint resolves these globs against the project root, which a
// path-matching heuristic inside the rule could not do safely.
const testFiles = [
  '**/*.{test,spec}.{js,jsx,mjs,cjs,ts,tsx,mts,cts}',
  '**/__tests__/**',
  '**/__mocks__/**',
  '**/test/**',
  '**/tests/**',
  '**/test-utils/**',
]

/** Creates a config that registers this plugin for matching source files. */
function createPluginConfig(rules: NonNullable<Linter.Config['rules']>): Linter.Config {
  return {
    files: sourceFiles,
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@ansible': plugin,
    },
    rules,
  }
}

plugin.configs.recommended = [
  createPluginConfig({ '@ansible/no-nested-component-definitions': 'error' }),
  {
    files: testFiles,
    rules: {
      '@ansible/no-nested-component-definitions': 'off',
    },
  },
]

plugin.configs['documented-functions'] = [createPluginConfig({ '@ansible/require-function-jsdoc': 'error' })]
