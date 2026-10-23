import { ESLint } from 'eslint'
import { mkdtemp, rm } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

import ansible from '../../src/plugin.js'

const packageJson = createRequire(import.meta.url)('../../package.json') as { version: string }

describe('plugin export', () => {
  it('exports the plugin rules and opt-in configs', () => {
    expect(ansible.meta).toMatchObject({
      name: '@ansible/eslint-plugin',
      version: packageJson.version,
    })
    expect(Object.keys(ansible.rules ?? {})).toEqual([
      'no-barrel-files',
      'no-nested-component-definitions',
      'require-function-jsdoc',
    ])
    expect(Object.keys(ansible.configs)).toEqual(['recommended', 'documented-functions'])
  })
})

describe('config integration', () => {
  it('loads the default export through ESLint and runs the custom rule', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: ansible.configs.recommended,
    })
    const [result] = await eslint.lintText('function Parent() { const Child = () => <div />; return <Child />; }', {
      filePath: 'Component.jsx',
    })

    expect(result?.messages.some((message) => message.ruleId === '@ansible/no-nested-component-definitions')).toBe(true)
  })

  it('does not apply the rule to test files', async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: ansible.configs.recommended,
    })

    for (const filePath of [
      'Component.test.jsx',
      'Component.spec.tsx',
      '__tests__/Component.jsx',
      'test/Component.jsx',
      'tests/render-helpers.tsx',
      'test-utils/render.tsx',
    ]) {
      const [result] = await eslint.lintText('function Parent() { const Child = () => <div />; return <Child />; }', {
        filePath,
      })

      expect(result?.messages, filePath).toEqual([])
    }
  })

  it('still applies the rule when a directory above the project is named tests', async () => {
    const projectRoot = await mkdtemp(join(tmpdir(), 'tests-'))
    const eslint = new ESLint({
      cwd: projectRoot,
      overrideConfigFile: true,
      overrideConfig: ansible.configs.recommended,
    })

    try {
      const [result] = await eslint.lintText('function Parent() { const Child = () => <div />; return <Child />; }', {
        filePath: join(projectRoot, 'src/Component.jsx'),
      })

      expect(result?.messages.map((message) => message.ruleId)).toContain('@ansible/no-nested-component-definitions')
    } finally {
      await rm(projectRoot, { recursive: true, force: true })
    }
  })
})
