import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'
import parser from '@typescript-eslint/parser'

import ansible from '@ansible/eslint-plugin'

describe('published ESLint package', () => {
  it('exports the documented-functions rule and opt-in config', () => {
    expect(Object.keys(ansible.rules ?? {})).toContain('require-function-jsdoc')
    expect(Object.keys(ansible.configs ?? {})).toEqual(['recommended', 'documented-functions'])
  })

  it('loads the published package and reports barrel files', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [...ansible.configs.recommended, { rules: { '@ansible/no-barrel-files': 'error' } }],
    })
    const [result] = await eslint.lintText("export { value } from './value.js';", {
      filePath: 'index.js',
    })

    expect(result?.messages.some((message) => message.ruleId === '@ansible/no-barrel-files')).toBe(true)
  })

  it('requires prose only when the documented-functions config is enabled', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [...ansible.configs.recommended, ...ansible.configs['documented-functions']],
    })
    const recommendedEslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: ansible.configs.recommended,
    })
    const code = 'function readValue(value) { return value; }'

    const [documentedResult] = await eslint.lintText(code, { filePath: 'reader.js' })
    const [recommendedResult] = await recommendedEslint.lintText(code, {
      filePath: 'reader.js',
    })

    expect(documentedResult?.messages.map((message) => message.ruleId)).toContain('@ansible/require-function-jsdoc')
    expect(recommendedResult?.messages.map((message) => message.ruleId)).not.toContain(
      '@ansible/require-function-jsdoc',
    )
  })

  it('allows JSDoc type tags when a function has descriptive prose', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: ansible.configs['documented-functions'],
    })
    const [result] = await eslint.lintText(
      '/** Reads a value. @param {string} value The input. @returns {string} The value. */ function readValue(value) { return value; }',
      { filePath: 'reader.js' },
    )

    expect(result?.messages).toEqual([])
  })

  it('works with a consumer-supplied TypeScript parser', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ['**/*.ts'],
          languageOptions: { parser },
        },
        ...ansible.configs['documented-functions'],
      ],
    })
    const [result] = await eslint.lintText(
      '/** Reads a value.\n * @param {string} value The input.\n * @returns {string} The value.\n */ function readValue(value: string): string { return value; }',
      { filePath: 'reader.ts' },
    )

    expect(result?.messages).toEqual([])
  })

  it('applies the recommended rule to TypeScript module extensions', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        {
          files: ['**/*.{ts,tsx,mts,cts}'],
          languageOptions: { parser },
        },
        ...ansible.configs.recommended,
      ],
    })
    const code =
      'function Parent() { const Child = () => React.createElement("div"); return React.createElement(Child); }'

    for (const extension of ['ts', 'tsx', 'mts', 'cts']) {
      const [result] = await eslint.lintText(code, {
        filePath: `Component.${extension}`,
      })

      expect(result?.messages.map((message) => message.ruleId)).toContain('@ansible/no-nested-component-definitions')
    }
  })
})
