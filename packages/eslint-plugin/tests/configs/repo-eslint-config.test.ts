import { ESLint } from 'eslint'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// @ts-expect-error The JavaScript ESLint config intentionally has no declaration file.
import repoEslintConfig from '../../eslint.config.js'

const repositoryRoot = resolve(fileURLToPath(new URL('../../../..', import.meta.url)))

describe('repository ESLint config', () => {
  // The config is always run from the repository root, so its patterns are
  // root-relative and only this working directory needs covering.
  const eslint = new ESLint({
    cwd: repositoryRoot,
    overrideConfigFile: true,
    overrideConfig: repoEslintConfig,
  })

  it('rejects raw AST discriminator strings in published and internal rule implementations', async () => {
    for (const filePath of [
      'packages/eslint-plugin/src/rules/example.ts',
      'packages/eslint-plugin/eslint-rules/example.ts',
    ]) {
      const [result] = await eslint.lintText('node.kind === "method";', { filePath })
      expect(
        result?.messages.map((message) => message.ruleId),
        filePath,
      ).toContain('project/no-ast-discriminator-strings')
    }
  })

  it('does not apply the AST discriminator guard to Knowledge source', async () => {
    const [result] = await eslint.lintText('record.type === "feature";', {
      filePath: 'packages/knowledge/src/example.ts',
    })

    expect(result?.messages.map((message) => message.ruleId)).not.toContain('project/no-ast-discriminator-strings')
  })

  it('does not apply the project-only rule outside custom rule implementations', async () => {
    const [result] = await eslint.lintText('record.type === "feature";', {
      filePath: 'packages/eslint-plugin/src/utils/example.ts',
    })

    expect(result?.messages.map((message) => message.ruleId)).not.toContain('project/no-ast-discriminator-strings')
  })

  it('requires function descriptions across existing and future workspaces', async () => {
    const sourcePaths = [
      'packages/eslint-plugin/src/rules/example.ts',
      'packages/eslint-plugin/src/utils/example.ts',
      'packages/eslint-plugin/eslint-rules/example.ts',
      'packages/knowledge/src/example.ts',
      'packages/md-link-lint/src/example.ts',
      'packages/playwright-visual-regression/src/example.ts',
      'packages/future-workspace/custom-layout/example.ts',
      'packages/future-workspace/scripts/prepare.ts',
      'packages/future-workspace/tests/helpers.ts',
      'packages/future-workspace/example.test.ts',
      'packages/future-workspace/tool.config.ts',
    ]

    for (const filePath of sourcePaths) {
      const [result] = await eslint.lintText('function readValue(value: string) { return value; }', {
        filePath,
      })

      expect(
        result?.messages.map((message) => message.ruleId),
        filePath,
      ).toContain('@ansible/require-function-jsdoc')
    }
  })

  it('requires descriptions for every supported workspace file extension', async () => {
    for (const extension of ['js', 'jsx', 'ts', 'tsx']) {
      const filePath = `packages/future-workspace/example.${extension}`
      const [result] = await eslint.lintText('function readValue(value) { return value; }', {
        filePath,
      })
      expect(result?.fatalErrorCount, filePath).toBe(0)
      expect(
        result?.messages.map((message) => message.ruleId),
        filePath,
      ).toContain('@ansible/require-function-jsdoc')
    }
  })

  it('accepts documented helpers and inline callbacks in tests', async () => {
    const [result] = await eslint.lintText(
      '/** Removes surrounding whitespace before comparison. */ const normalize = (value: string) => value.trim(); values.map((value: string) => normalize(value));',
      { filePath: 'packages/future-workspace/test/example.test.ts' },
    )
    expect(result?.messages).toEqual([])
  })

  it('exempts fixtures from descriptions while retaining other lint rules', async () => {
    for (const directory of ['fixtures', '__fixtures__']) {
      const filePath = `packages/future-workspace/test/${directory}/src/example.ts`
      const [functionResult] = await eslint.lintText("function readValue() { return 'value'; }", {
        filePath,
      })
      expect(functionResult?.messages).toEqual([])
      const [barrelResult] = await eslint.lintText("export { value } from './value.js';", {
        filePath,
      })
      expect(
        barrelResult?.messages.map((message) => message.ruleId),
        filePath,
      ).toContain('@ansible/no-barrel-files')
    }
  })

  it('ignores generated output in future workspaces', async () => {
    const [result] = await eslint.lintText("function readValue() { return 'value'; }", {
      filePath: 'packages/future-workspace/dist/example.js',
      warnIgnored: false,
    })
    expect(result).toBeUndefined()
  })

  it('rejects repeated signature tags in all TypeScript workspaces', async () => {
    const code =
      '/** Reads a value.\n * @param value The input.\n */ function readValue(value: string) { return value; }'
    for (const extension of ['ts', 'tsx']) {
      const [result] = await eslint.lintText(code, {
        filePath: `packages/future-workspace/src/example.${extension}`,
      })
      expect(result?.messages.map((message) => message.message)).toContain(
        'Do not repeat TypeScript types or signature details in JSDoc.',
      )
    }
  })

  it('allows JavaScript type tags across workspaces', async () => {
    for (const extension of ['js', 'jsx']) {
      const [result] = await eslint.lintText(
        '/** Reads a value. @param {string} value The input. @returns {string} The value. */ function readValue(value) { return value; }',
        { filePath: `packages/future-workspace/src/example.${extension}` },
      )
      expect(result?.messages).toEqual([])
    }
  })

  it('enforces the barrel file and nested component rules from the published plugin', async () => {
    const [barrelResult] = await eslint.lintText("export { value } from './value.js';", {
      filePath: 'packages/knowledge/src/index.ts',
    })
    const [componentResult] = await eslint.lintText(
      'function Parent() { const Child = () => <div />; return <Child />; }',
      { filePath: 'packages/knowledge/src/Component.tsx' },
    )

    expect(barrelResult?.messages.map((message) => message.ruleId)).toContain('@ansible/no-barrel-files')
    expect(componentResult?.messages.map((message) => message.ruleId)).toContain(
      '@ansible/no-nested-component-definitions',
    )
  })

  it('enforces portable rules in future workspaces without leaking the AST guard', async () => {
    const [barrelResult] = await eslint.lintText("export { value } from './value.js';", {
      filePath: 'packages/future-workspace/custom-layout/index.ts',
    })
    const [componentResult] = await eslint.lintText(
      '/** Renders the parent. */ function Parent() { /** Renders its child. */ const Child = () => <div />; return <Child />; }',
      { filePath: 'packages/future-workspace/custom-layout/Component.tsx' },
    )
    const [domainResult] = await eslint.lintText('record.kind === "feature";', {
      filePath: 'packages/future-workspace/custom-layout/domain.ts',
    })
    expect(barrelResult?.messages.map((message) => message.ruleId)).toContain('@ansible/no-barrel-files')
    expect(componentResult?.messages.map((message) => message.ruleId)).toContain(
      '@ansible/no-nested-component-definitions',
    )
    expect(domainResult?.messages).toEqual([])
  })

  it('retains the nested component exception for documented test wrappers', async () => {
    const [result] = await eslint.lintText(
      '/** Supplies a test wrapper. */ function Wrapper() { /** Renders fixture content. */ const Child = () => <div />; return <Child />; }',
      { filePath: 'packages/future-workspace/test/Component.test.tsx' },
    )
    expect(result?.messages).toEqual([])
  })
})
