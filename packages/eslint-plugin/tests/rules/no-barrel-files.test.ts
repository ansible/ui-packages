import { RuleTester } from './rule-tester.js'
import parser from '@typescript-eslint/parser'

import rule from '../../src/rules/no-barrel-files.js'

new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
}).run('no-barrel-files', rule, {
  valid: [
    'export const value = 1;',
    "import { value } from './value.js'; export const derived = value + 1;",
    "import { value } from './value.js'; export { value }; export const marker = true;",
    'export {};',
    'export type Value = string;',
    // A side-effect import means the module does something beyond forwarding.
    "import './polyfill.js'; export * from './feature.js';",
  ],
  invalid: [
    {
      code: "export * from './feature.js';",
      errors: [{ messageId: 'noBarrelFiles' }],
    },
    {
      code: "export { value } from './feature.js';",
      errors: [{ messageId: 'noBarrelFiles' }],
    },
    {
      code: "import { value } from './feature.js'; export { value };",
      errors: [{ messageId: 'noBarrelFiles' }],
    },
    {
      code: "import value from './feature.js'; export default value;",
      errors: [{ messageId: 'noBarrelFiles' }],
    },
    {
      code: "export type { Feature } from './feature.js';",
      errors: [{ messageId: 'noBarrelFiles' }],
    },
  ],
})
