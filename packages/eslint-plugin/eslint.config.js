// This file configures linting for the whole repository, but it lives in the
// plugin workspace so that `@typescript-eslint/parser` and the rule sources it
// imports resolve without depending on npm hoisting. The workspace lint script
// changes to the repository root before invoking ESLint, so every pattern
// below is root-relative.
import parser from '@typescript-eslint/parser'

import noAstDiscriminatorStrings from './eslint-rules/no-ast-discriminator-strings.ts'
import ansible from './src/plugin.ts'

// Guards this repository's own source. Not part of the published plugin.
const project = {
  rules: {
    'no-ast-discriminator-strings': noAstDiscriminatorStrings,
  },
}

const workspaceCode = ['packages/**/*.{js,jsx,ts,tsx}']
const workspaceTypeScript = ['packages/**/*.{ts,tsx}']

export default [
  {
    ignores: ['**/dist/**', '**/node_modules/**'],
  },
  {
    files: workspaceTypeScript,
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  // Consume the published plugin the same way a downstream project would.
  ...ansible.configs.recommended,
  ...ansible.configs['documented-functions'].map((config) => ({
    ...config,
    files: workspaceCode,
  })),
  {
    files: workspaceCode,
    plugins: {
      '@ansible': ansible,
      project,
    },
    rules: {
      '@ansible/no-barrel-files': 'error',
    },
  },
  {
    files: workspaceTypeScript,
    rules: {
      '@ansible/require-function-jsdoc': ['error', { allowTypeTags: false }],
    },
  },
  {
    files: ['packages/**/fixtures/**', 'packages/**/__fixtures__/**'],
    rules: {
      '@ansible/require-function-jsdoc': 'off',
    },
  },
  {
    files: ['packages/eslint-plugin/{src/rules,eslint-rules}/**/*.{js,jsx,ts,tsx}'],
    rules: {
      'project/no-ast-discriminator-strings': 'error',
    },
  },
]
