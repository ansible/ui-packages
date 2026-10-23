import parser from '@typescript-eslint/parser'
import { RuleTester } from './rule-tester.js'

import rule from '../../src/rules/require-function-jsdoc.js'

new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
}).run('require-function-jsdoc (JavaScript)', rule, {
  valid: [
    '/** Reads one value. @param {string} value The input. @returns {string} The value. */ function readValue(value) { return value; }',
    '/** Trims a value. */ const trimValue = (value) => value.trim();',
    'values.map((value) => value.trim());',
    'const reader = { /** Reads one value. */ readValue(value) { return value; } };',
    'class Reader { /** Reads one value. */ readValue(value) { return value; } }',
    // A line comment between the JSDoc and the declaration must not hide it.
    '/** Reads one value. */\n// eslint-disable-next-line no-shadow\nfunction readValue(value) { return value; }',
    '/** Reads one value. */\n// First note.\n// Second note.\nconst readValue = (value) => value;',
  ],
  invalid: [
    {
      code: 'function readValue(value) { return value; }',
      errors: [{ messageId: 'missingDescription' }],
    },
    // A line comment alone is not JSDoc.
    {
      code: '// Reads one value.\nfunction readValue(value) { return value; }',
      errors: [{ messageId: 'missingDescription' }],
    },
    // One report per declaration, even though it holds two functions.
    {
      code: 'const readValue = (value) => value, ReadOther = (value) => value;',
      errors: [{ messageId: 'missingDescription' }],
    },
    {
      code: '/** @param {string} value The input. */ function readValue(value) { return value; }',
      errors: [{ messageId: 'missingDescription' }],
    },
    {
      code: 'const readValue = (value) => value;',
      errors: [{ messageId: 'missingDescription' }],
    },
  ],
})

new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
}).run('require-function-jsdoc', rule, {
  valid: [
    '/** Reads one value from the source. */ function readValue(source: string): string { return source; }',
    '/** Reads one value from the source. */ export function readValue(source: string): string { return source; }',
    '/** Reads one value from the source. */ const readValue = (source: string): string => source;',
    '/** Reads one value from the source. */ export const readValue = (source: string): string => source;',
    "/** Reads one value from the source. */ const readValue = (() => 'value') as () => string;",
    "/** Reads one value from the source. */ const readValue = (() => 'value') satisfies () => string;",
    'class Reader { /** Reads one value from the source. */ readValue(source: string): string { return source; } }',
    '/** Reads one value from the source.\n * @param {string} source The input.\n * @returns {string} The same value.\n */ function readValue(source: string): string { return source; }',
    'values.map((value: string) => value.trim());',
  ],
  invalid: [
    {
      code: 'function readValue(source: string): string { return source; }',
      errors: [{ messageId: 'missingDescription' }],
    },
    {
      code: '/** @throws {Error} when the source is unavailable. */ function readValue(source: string): string { return source; }',
      errors: [{ messageId: 'missingDescription' }],
    },
    {
      code: '/** Reads one value from the source.\n * @param source The source value.\n * @returns The same value.\n */ function readValue(source: string): string { return source; }',
      options: [{ allowTypeTags: false }],
      errors: [{ messageId: 'redundantTypeInformation' }],
    },
    {
      code: 'const readValue = (source: string): string => source;',
      errors: [{ messageId: 'missingDescription' }],
    },
    {
      code: "const readValue = (() => 'value') as () => string;",
      errors: [{ messageId: 'missingDescription' }],
    },
    {
      code: "const readValue = (() => 'value') satisfies () => string;",
      errors: [{ messageId: 'missingDescription' }],
    },
    {
      code: 'const source = { readValue(value: string): string { return value; } };',
      errors: [{ messageId: 'missingDescription' }],
    },
    {
      code: 'export const readValue = (source: string): string => source;',
      errors: [{ messageId: 'missingDescription' }],
    },
    {
      code: 'class Reader { readValue(source: string): string { return source; } }',
      errors: [{ messageId: 'missingDescription' }],
    },
  ],
})
