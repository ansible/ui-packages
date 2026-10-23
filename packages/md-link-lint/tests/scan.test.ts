import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, cpSync, mkdtempSync, mkdirSync, renameSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { scan } from '../src/scan.js'
import { runCli } from '../src/cli.js'

const temporaryRepositories: string[] = []
const integrationFixture = fileURLToPath(new URL('./fixtures/integration-repository', import.meta.url))
const networkGuard = fileURLToPath(new URL('./network-guard.js', import.meta.url))
const builtCli = fileURLToPath(new URL('../dist/cli.js', import.meta.url))

/** Create a committed temporary repository and register it for cleanup after the test. */
function makeRepository(files: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), 'md-link-lint-'))
  temporaryRepositories.push(root)
  initializeRepository(root)
  writeFiles(root, files)
  commitAll(root)
  return root
}

/** Copy checked-in fixtures, restore ignore filenames, and commit an isolated repository. */
function makeFixtureRepository(): string {
  const root = mkdtempSync(join(tmpdir(), 'md-link-lint-fixture-'))
  temporaryRepositories.push(root)
  cpSync(integrationFixture, root, { recursive: true })
  renameSync(join(root, '.gitignore.fixture'), join(root, '.gitignore'))
  renameSync(join(root, '.agents', '.gitignore.fixture'), join(root, '.agents', '.gitignore'))
  initializeRepository(root)
  commitAll(root)
  return root
}

/** Initialize fixture Git metadata with a test identity and signing disabled. */
function initializeRepository(root: string): void {
  git(root, ['init', '--quiet'])
  git(root, ['config', 'user.name', 'Markdown Link Lint'])
  git(root, ['config', 'user.email', 'md-link-lint@example.test'])
  git(root, ['config', 'commit.gpgsign', 'false'])
}

/** Run a fixture Git command and fail immediately if it exits unsuccessfully. */
function git(cwd: string, args: string[]): void {
  execFileSync('git', args, { cwd, stdio: 'ignore' })
}

/** Capture Git output for assertions about fixture tracking and ignore behavior. */
function gitOutput(cwd: string, args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' })
}

/** Create parent directories and populate fixture files with the supplied contents. */
function writeFiles(root: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const absolute = join(root, path)
    mkdirSync(dirname(absolute), { recursive: true })
    writeFileSync(absolute, content)
  }
}

/** Commit all fixture changes so tests can distinguish tracked and untracked files. */
function commitAll(root: string): void {
  git(root, ['add', '-A'])
  git(root, ['commit', '--quiet', '-m', 'fixtures'])
}

/** Run the in-process CLI and collect its status and both output streams. */
function captureCli(args: string[], cwd: string) {
  let stdout = ''
  let stderr = ''
  const exitCode = runCli(args, {
    cwd,
    /** Accumulate normal output for assertions without writing to the test runner’s console. */
    stdout: (chunk) => (stdout += chunk),
    /** Accumulate diagnostic output separately from the normal report. */
    stderr: (chunk) => (stderr += chunk),
  })
  return { exitCode, stdout, stderr }
}

/** Remove inherited terminal color flags so child CLI diagnostics stay deterministic. */
function childProcessEnvironment() {
  const env = { ...process.env }
  delete env.FORCE_COLOR
  delete env.NO_COLOR
  return env
}

/** Run the built executable in a child process, optionally blocking network access. */
function captureBuiltCli(args: string[], cwd: string, guardNetwork = false) {
  const nodeArgs = guardNetwork ? ['--import', networkGuard, builtCli, ...args] : [builtCli, ...args]
  const result = spawnSync(process.execPath, nodeArgs, {
    cwd,
    encoding: 'utf8',
    env: childProcessEnvironment(),
  })
  return {
    exitCode: result.status ?? 2,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error,
  }
}

afterEach(() => {
  for (const root of temporaryRepositories.splice(0)) {
    rmSync(root, { recursive: true, force: true })
  }
})

describe('scan', () => {
  it('matches a golden report for a checked-in multi-file Markdown repository', () => {
    const root = makeFixtureRepository()

    expect(gitOutput(root, ['check-ignore', 'drafts/ignored.md']).trim()).toBe('drafts/ignored.md')
    expect(gitOutput(root, ['check-ignore', '.agents/nested-ignored.md']).trim()).toBe('.agents/nested-ignored.md')

    const report = scan({ cwd: root })

    expect(
      report.findings.map(({ sourcePath, line, column, destination, code }) => ({
        sourcePath,
        line,
        column,
        destination,
        code,
      })),
    ).toEqual([
      {
        sourcePath: '.agents/AGENTS.md',
        line: 4,
        column: 6,
        destination: '../docs/policy.md#security-basics',
        code: 'missing-file',
      },
      {
        sourcePath: '.agents/AGENTS.md',
        line: 5,
        column: 8,
        destination: '../docs/review.md#review-procces',
        code: 'missing-anchor',
      },
      {
        sourcePath: '.agents/AGENTS.md',
        line: 16,
        column: 5,
        destination: '../docs/bad%ZZ.md',
        code: 'malformed-path-encoding',
      },
      {
        sourcePath: '.agents/AGENTS.md',
        line: 17,
        column: 9,
        destination: '../docs/review.md#bad%ZZ',
        code: 'malformed-fragment-encoding',
      },
      {
        sourcePath: '.agents/AGENTS.md',
        line: 19,
        column: 5,
        destination: '../docs/not-present-multiline.md',
        code: 'missing-file',
      },
      {
        sourcePath: 'README.md',
        line: 23,
        column: 1,
        destination: 'docs/not-present.md',
        code: 'missing-file',
      },
    ])
    expect(report.findings[0]?.reason).toBe('target does not exist')
    expect(report.findings[1]?.reason).toBe('heading anchor "review-procces" does not exist in docs/review.md')
    expect(report.scanErrors).toEqual([])
    expect(report.counts).toEqual({
      filesSelected: 5,
      filesScanned: 5,
      linksFound: 39,
      linksChecked: 35,
      linksSkipped: 4,
      anchorChecksSkipped: 1,
    })
  })

  it('checks relative and repository-root paths, images, directories, and query-bearing links', () => {
    const root = makeRepository({
      'AGENTS.md': [
        '[guide](docs/guide.md?view=short#setup)',
        '[root path](/docs/guide.md)',
        '[directory](assets/)',
        '![logo](assets/test%20logo.png)',
        '[missing](docs/missing.md)',
      ].join('\n'),
      'docs/guide.md': '# Guide\n\n## Setup\n',
      'assets/test logo.png': 'fixture',
      'assets/readme.txt': 'not markdown',
    })

    const report = scan({ cwd: root })

    expect(report.findings).toEqual([
      {
        sourcePath: 'AGENTS.md',
        line: 5,
        column: 1,
        destination: 'docs/missing.md',
        code: 'missing-file',
        reason: 'target does not exist',
      },
    ])
    expect(report.counts).toMatchObject({
      filesScanned: 2,
      linksFound: 5,
      linksChecked: 5,
      linksSkipped: 0,
      anchorChecksSkipped: 0,
    })
  })

  it('checks current and linked Markdown headings using formatted text and duplicate slugs', () => {
    const root = makeRepository({
      'AGENTS.md': [
        '## **Install** the CLI',
        "## What's New?",
        '## Usage',
        '## Usage',
        '[install](#install-the-cli)',
        '[second usage](#usage-1)',
        '[wrong case](#Usage)',
        '[linked](docs/guide.markdown#quick-start)',
        '[wrong linked case](docs/guide.markdown#Quick-Start)',
      ].join('\n'),
      'docs/guide.markdown': '# Guide\n\n## Quick Start\n',
    })

    const report = scan({ cwd: root })

    expect(report.findings).toEqual([
      {
        sourcePath: 'AGENTS.md',
        line: 7,
        column: 1,
        destination: '#Usage',
        code: 'missing-anchor',
        reason: 'heading anchor "Usage" does not exist in AGENTS.md',
      },
      {
        sourcePath: 'AGENTS.md',
        line: 9,
        column: 1,
        destination: 'docs/guide.markdown#Quick-Start',
        code: 'missing-anchor',
        reason: 'heading anchor "Quick-Start" does not exist in docs/guide.markdown',
      },
    ])
    expect(report.counts.anchorChecksSkipped).toBe(0)
  })

  it('extracts inline, reference, image, and GFM autolinks but ignores code and HTML', () => {
    const root = makeRepository({
      'AGENTS.md': [
        '[inline](missing-inline.md)',
        '[full][guide] [collapsed][] [shortcut]',
        '![image][asset]',
        '<https://example.test/path>',
        'www.example.test/path',
        '`[inline code](no-inline-code.md)`',
        '',
        '```md',
        '[fenced code](no-fenced-code.md)',
        '```',
        '    [indented code](no-indented-code.md)',
        '<a href="no-html-link.md">html link</a>',
        '',
        '[guide]: missing-reference.md',
        '[collapsed]: missing-collapsed.md',
        '[shortcut]: missing-shortcut.md',
        '[asset]: missing-image.png',
        'The [bracketed phrase] is prose, not a link.',
      ].join('\n'),
    })

    const report = scan({ cwd: root })

    expect(report.findings.map(({ destination, line }) => [destination, line])).toEqual([
      ['missing-inline.md', 1],
      ['missing-reference.md', 2],
      ['missing-collapsed.md', 2],
      ['missing-shortcut.md', 2],
      ['missing-image.png', 3],
    ])
    expect(report.counts).toMatchObject({
      linksFound: 7,
      linksChecked: 5,
      linksSkipped: 2,
    })
  })

  it('includes dot directories, tracked ignored files, and untracked non-ignored files', () => {
    const root = makeRepository({
      '.gitignore': '.agents/untracked.md\n.ignored.md\n.hidden/target.txt\n',
      'AGENTS.md': '[ignored target](.hidden/target.txt)\n',
      '.ignored.md': '[tracked despite ignore](present.md)\n',
      '.agents/tracked.md': 'tracked dot file\n',
      '.hidden/target.txt': 'exists although ignored\n',
      'present.md': 'present\n',
    })
    writeFiles(root, {
      '.agents/.gitignore': 'nested-ignored.md\n',
      '.agents/nested-ignored.md': 'must be ignored by nested rules\n',
      '.agents/untracked.md': 'must be ignored\n',
      '.agents/public.markdown': 'untracked and visible\n',
    })
    git(root, ['add', '-f', '.ignored.md'])
    git(root, ['commit', '--quiet', '-m', 'track ignored Markdown'])

    expect(gitOutput(root, ['ls-files', '.agents/public.markdown'])).toBe('')

    const report = scan({ cwd: root })

    expect(report.scanErrors).toEqual([])
    expect(report.counts.filesScanned).toBe(5)
    expect(report.counts.linksChecked).toBe(2)
    expect(report.findings).toEqual([])

    const explicit = scan({ cwd: root, paths: ['.agents', '.agents/tracked.md'] })
    expect(explicit.counts.filesScanned).toBe(2)
  })

  it('reads modified tracked Markdown from the working tree', () => {
    const root = makeRepository({
      'AGENTS.md': '[target](present.md)\n',
      'present.md': 'exists\n',
    })
    writeFileSync(join(root, 'AGENTS.md'), '[target](missing-after-edit.md)\n')

    expect(gitOutput(root, ['status', '--short'])).toMatch(/M AGENTS\.md/)
    expect(scan({ cwd: root }).findings).toEqual([
      {
        sourcePath: 'AGENTS.md',
        line: 1,
        column: 1,
        destination: 'missing-after-edit.md',
        code: 'missing-file',
        reason: 'target does not exist',
      },
    ])
  })

  it('applies repeatable source exclusions and deduplicates overlapping path arguments', () => {
    const root = makeRepository({
      'docs/AGENTS.md': '[bad](missing.md)\n',
      'docs/child.md': '[bad](missing.md)\n',
      'docs/generated.md': '[ignored by exclude](missing.md)\n',
      'README.MARKDOWN': '[bad](missing.md)\n',
    })

    const report = scan({
      cwd: root,
      paths: ['docs', 'docs/AGENTS.md', join(root, 'README.MARKDOWN')],
      exclude: ['docs/generated.md', 'README.MARKDOWN'],
    })

    expect(report.counts.filesScanned).toBe(2)
    expect(report.findings.map((finding) => finding.sourcePath)).toEqual(['docs/AGENTS.md', 'docs/child.md'])
  })

  it('checks linked Markdown outside the selected source directory without scanning its links', () => {
    const root = makeRepository({
      'src/AGENTS.md': '[guide](../docs/guide.md#install)\n',
      'docs/guide.md': '## Install\n\n[not selected](missing.md)\n',
    })

    const report = scan({ cwd: root, paths: ['src'] })

    expect(report.findings).toEqual([])
    expect(report.counts.filesScanned).toBe(1)
    expect(report.counts.linksFound).toBe(1)
    expect(report.counts.linksChecked).toBe(1)
  })

  it('reports links outside the repository without reading their Markdown headings', () => {
    const outside = mkdtempSync(join(tmpdir(), 'md-link-lint-outside-target-'))
    temporaryRepositories.push(outside)
    const outsideMarkdown = join(outside, 'outside.md')
    writeFileSync(outsideMarkdown, '## Secret Heading\n')

    const root = makeRepository({ 'AGENTS.md': 'initial content\n' })
    const destination = relative(root, outsideMarkdown).split(sep).join('/')
    writeFileSync(join(root, 'AGENTS.md'), `[outside](${destination}#missing-heading)\n`)

    const report = scan({ cwd: root })

    expect(report.findings).toEqual([
      {
        sourcePath: 'AGENTS.md',
        line: 1,
        column: 1,
        destination: `${destination}#missing-heading`,
        code: 'outside-repository-link',
        reason: 'target resolves outside the Git working tree',
      },
    ])
  })

  it.skipIf(process.platform === 'win32')(
    'allows in-repository symlinks and rejects links through external symlinks',
    () => {
      const outside = mkdtempSync(join(tmpdir(), 'md-link-lint-outside-symlink-'))
      temporaryRepositories.push(outside)
      const outsideMarkdown = join(outside, 'outside.md')
      writeFileSync(outsideMarkdown, '## Secret Heading\n')

      const root = makeRepository({
        'AGENTS.md': '[inside](inside.md#inside)\n[outside](outside.md#missing-heading)\n',
        'docs/target.md': '## Inside\n',
      })
      symlinkSync(join(root, 'docs/target.md'), join(root, 'inside.md'), 'file')
      symlinkSync(outsideMarkdown, join(root, 'outside.md'), 'file')

      const report = scan({ cwd: root })

      expect(report.findings).toEqual([
        {
          sourcePath: 'AGENTS.md',
          line: 2,
          column: 1,
          destination: 'outside.md#missing-heading',
          code: 'outside-repository-link',
          reason: 'target resolves outside the Git working tree',
        },
      ])
    },
  )

  it.skipIf(process.platform === 'win32')(
    'does not read a tracked Markdown source symlink outside the repository',
    () => {
      const outside = mkdtempSync(join(tmpdir(), 'md-link-lint-outside-source-'))
      temporaryRepositories.push(outside)
      const outsideMarkdown = join(outside, 'outside.md')
      writeFileSync(outsideMarkdown, '## Secret Heading\n')

      const root = makeRepository({ 'README.md': '# Repository\n' })
      symlinkSync(outsideMarkdown, join(root, 'linked.md'), 'file')
      git(root, ['add', 'linked.md'])
      git(root, ['commit', '--quiet', '-m', 'add linked source'])

      const report = scan({ cwd: root })

      expect(report.scanErrors).toContainEqual({
        code: 'source-path-outside-repository',
        sourcePath: 'linked.md',
        reason: 'source resolves outside the Git working tree',
      })
    },
  )

  it.skipIf(process.platform === 'win32')(
    'rejects an explicitly selected in-repository symlink to an external path',
    () => {
      const outside = mkdtempSync(join(tmpdir(), 'md-link-lint-outside-input-'))
      temporaryRepositories.push(outside)
      const outsideMarkdown = join(outside, 'outside.md')
      writeFileSync(outsideMarkdown, '# External\n')

      const root = makeRepository({ 'AGENTS.md': '# Repository\n' })
      symlinkSync(outsideMarkdown, join(root, 'linked.md'), 'file')

      const report = scan({ cwd: root, paths: ['linked.md'] })

      expect(report.scanErrors).toContainEqual({
        code: 'input-path-outside-repository',
        reason: 'input path resolves outside the Git working tree: linked.md',
      })
    },
  )

  it('preserves every source occurrence when a shared target is missing', () => {
    const root = makeRepository({
      'AGENTS.md': '[first](missing.md) and [second](missing.md)\n',
      'docs/OTHER.md': '[third](../missing.md)\n',
    })

    const report = scan({ cwd: root })

    expect(report.findings).toEqual([
      {
        sourcePath: 'AGENTS.md',
        line: 1,
        column: 1,
        destination: 'missing.md',
        code: 'missing-file',
        reason: 'target does not exist',
      },
      {
        sourcePath: 'AGENTS.md',
        line: 1,
        column: 25,
        destination: 'missing.md',
        code: 'missing-file',
        reason: 'target does not exist',
      },
      {
        sourcePath: 'docs/OTHER.md',
        line: 1,
        column: 1,
        destination: '../missing.md',
        code: 'missing-file',
        reason: 'target does not exist',
      },
    ])
    expect(report.counts.linksChecked).toBe(3)
  })

  it('decodes URL paths and fragments, ignores query strings, and reports malformed encoding', () => {
    const root = makeRepository({
      'AGENTS.md': [
        '[encoded](./docs/Install%20guide%20%E6%97%A5%E6%9C%AC%E8%AA%9E.md?mode=full#quick-start)',
        '[bad path](./bad%ZZ.md)',
        '[bad fragment](docs/guide.md#%E0%A4%A)',
      ].join('\n'),
      'docs/Install guide 日本語.md': '## Quick Start\n',
      'docs/guide.md': '## Guide\n',
    })

    const report = scan({ cwd: root })

    expect(report.findings.map(({ code, line }) => [code, line])).toEqual([
      ['malformed-path-encoding', 2],
      ['malformed-fragment-encoding', 3],
    ])
  })

  it('checks file existence but skips fragments on directories and non-Markdown files', () => {
    const root = makeRepository({
      'AGENTS.md': ['[directory](assets/#anything)', '[source](src/index.ts#L10)', '[missing](missing.ts#L10)'].join(
        '\n',
      ),
      'assets/file.txt': 'exists\n',
      'src/index.ts': 'export {}\n',
    })

    const report = scan({ cwd: root })

    expect(report.findings.map(({ code, destination }) => [code, destination])).toEqual([
      ['missing-file', 'missing.ts#L10'],
    ])
    expect(report.counts.anchorChecksSkipped).toBe(2)
  })

  it('skips schemes and protocol-relative links without making requests', () => {
    const root = makeRepository({
      'AGENTS.md': [
        '[https](https://example.test/missing)',
        '[mail](mailto:person@example.test)',
        '[protocol relative](//example.test/missing)',
        '[file scheme](file:./missing.md)',
        '[custom scheme](custom:payload)',
      ].join('\n'),
    })

    const report = scan({ cwd: root })

    expect(report.findings).toEqual([])
    expect(report.counts).toMatchObject({ linksFound: 5, linksChecked: 0, linksSkipped: 5 })
  })

  it('treats empty destinations and empty fragments as links to the source document', () => {
    const root = makeRepository({
      'AGENTS.md': '## Current\n\n[empty]() [empty fragment](#) [query](?mode=full)\n',
    })

    const report = scan({ cwd: root })

    expect(report.findings).toEqual([])
    expect(report.counts.linksChecked).toBe(3)
  })

  it('does not report arbitrary bracketed prose as a broken reference', () => {
    const root = makeRepository({
      'AGENTS.md': 'A [bracketed phrase] without a reference definition.\n',
    })

    const report = scan({ cwd: root })

    expect(report.findings).toEqual([])
    expect(report.counts.linksChecked).toBe(0)
  })

  it('returns a successful zero-file report when selection contains no Markdown', () => {
    const root = makeRepository({ 'src/index.ts': 'export {}\n', 'README.txt': 'text\n' })

    const report = scan({ cwd: root, paths: ['src/index.ts', 'README.txt'] })

    expect(report.scanErrors).toEqual([])
    expect(report.counts).toEqual({
      filesSelected: 0,
      filesScanned: 0,
      linksFound: 0,
      linksChecked: 0,
      linksSkipped: 0,
      anchorChecksSkipped: 0,
    })
  })

  it('reports incomplete scans for unreadable selected source files', () => {
    const root = makeRepository({ 'AGENTS.md': '[link](target.md)\n' })
    rmSync(join(root, 'AGENTS.md'))
    mkdirSync(join(root, 'AGENTS.md'))

    const report = scan({ cwd: root })

    expect(report.findings).toEqual([])
    expect(report.scanErrors).toEqual([expect.objectContaining({ sourcePath: 'AGENTS.md', code: 'unreadable-source' })])
    expect(report.counts.filesScanned).toBe(0)
  })

  it.skipIf(process.platform === 'win32' || process.getuid?.() === 0)(
    'reports unreadable linked Markdown targets as incomplete scans',
    () => {
      const root = makeRepository({
        '.gitignore': 'private.md\n',
        'AGENTS.md': '[private guide](private.md#section)\n',
      })
      const targetPath = join(root, 'private.md')
      writeFileSync(targetPath, '## Section\n')
      chmodSync(targetPath, 0)

      const report = (() => {
        try {
          return scan({ cwd: root })
        } finally {
          chmodSync(targetPath, 0o600)
        }
      })()

      expect(report.findings).toEqual([])
      expect(report.scanErrors).toEqual([
        expect.objectContaining({
          code: 'unreadable-target',
          sourcePath: 'AGENTS.md',
          line: 1,
          column: 1,
          destination: 'private.md#section',
          targetPath: 'private.md',
        }),
      ])
    },
  )

  it('reports a clear scan error outside a Git repository and for paths outside the repository', () => {
    const outside = mkdtempSync(join(tmpdir(), 'md-link-lint-outside-'))
    temporaryRepositories.push(outside)
    const noGit = scan({ cwd: outside })
    expect(noGit.scanErrors[0]?.code).toBe('not-a-git-repository')

    const root = makeRepository({ 'AGENTS.md': 'valid\n' })
    const outsidePath = join(outside, 'outside.md')
    writeFileSync(outsidePath, 'outside\n')
    const invalidInput = scan({ cwd: root, paths: [outsidePath] })
    expect(invalidInput.scanErrors[0]?.code).toBe('input-path-outside-repository')
  })
})

describe('runCli', () => {
  it('runs the built executable against the checked-in Markdown repository', () => {
    const root = makeFixtureRepository()
    const result = captureBuiltCli(['--json'], root, true)

    expect(result.error).toBeUndefined()
    expect(result.exitCode).toBe(1)
    expect(result.stderr).toBe('')
    const report = JSON.parse(result.stdout)
    expect(
      report.findings.map(({ sourcePath, line, column, destination, code }: Record<string, unknown>) => [
        sourcePath,
        line,
        column,
        destination,
        code,
      ]),
    ).toEqual([
      ['.agents/AGENTS.md', 4, 6, '../docs/policy.md#security-basics', 'missing-file'],
      ['.agents/AGENTS.md', 5, 8, '../docs/review.md#review-procces', 'missing-anchor'],
      ['.agents/AGENTS.md', 16, 5, '../docs/bad%ZZ.md', 'malformed-path-encoding'],
      ['.agents/AGENTS.md', 17, 9, '../docs/review.md#bad%ZZ', 'malformed-fragment-encoding'],
      ['.agents/AGENTS.md', 19, 5, '../docs/not-present-multiline.md', 'missing-file'],
      ['README.md', 23, 1, 'docs/not-present.md', 'missing-file'],
    ])
    expect(report.counts).toMatchObject({
      filesScanned: 5,
      linksFound: 39,
      linksChecked: 35,
      linksSkipped: 4,
    })
  })

  it.skipIf(process.platform === 'win32')('runs the built executable through a package-manager style symlink', () => {
    const root = makeRepository({ 'AGENTS.md': '# Instructions\n' })
    const binDirectory = mkdtempSync(join(tmpdir(), 'md-link-lint-bin-'))
    temporaryRepositories.push(binDirectory)
    const linkedCli = join(binDirectory, 'md-link-lint')
    symlinkSync(builtCli, linkedCli, 'file')

    const result = spawnSync(process.execPath, [linkedCli, '--json'], {
      cwd: root,
      encoding: 'utf8',
      env: childProcessEnvironment(),
    })

    expect(result.error).toBeUndefined()
    expect(result.status).toBe(0)
    expect(result.stderr).toBe('')
    expect(JSON.parse(result.stdout)).toMatchObject({
      findings: [],
      scanErrors: [],
      counts: { filesScanned: 1, linksFound: 0, linksChecked: 0, linksSkipped: 0 },
    })
  })

  it('maps built CLI process exit status to clean, invalid, and incomplete scans', () => {
    const root = makeRepository({ 'AGENTS.md': '[external](https://example.test)\n' })

    const clean = captureBuiltCli([], root)
    expect(clean.error).toBeUndefined()
    expect(clean.exitCode).toBe(0)
    expect(clean.stderr).toBe('')
    expect(clean.stdout).toContain('Scanned 1 Markdown files; checked 0 links; skipped 1 external links.')

    writeFileSync(join(root, 'AGENTS.md'), '[missing](missing.md)\n')
    const invalid = captureBuiltCli([], root)
    expect(invalid.exitCode).toBe(1)
    expect(invalid.stderr).toBe('')
    expect(invalid.stdout).toContain('AGENTS.md:1:1  missing-file  missing.md')

    rmSync(join(root, 'AGENTS.md'))
    mkdirSync(join(root, 'AGENTS.md'))
    const incomplete = captureBuiltCli([], root)
    expect(incomplete.exitCode).toBe(2)
    expect(incomplete.stderr).toBe('')
    expect(incomplete.stdout).toContain('unreadable-source')
  })

  it('prints sorted findings and a summary, returning 1 for invalid links', () => {
    const root = makeRepository({
      'z.md': '[bad](missing-z.md)\n',
      'AGENTS.md': '[bad](missing-a.md)\n',
    })

    const result = captureCli([], root)

    expect(result.exitCode).toBe(1)
    expect(result.stdout.indexOf('AGENTS.md:1:1')).toBeLessThan(result.stdout.indexOf('z.md:1:1'))
    expect(result.stdout).toContain('AGENTS.md:1:1  missing-file  missing-a.md')
    expect(result.stdout).toContain('z.md:1:1  missing-file  missing-z.md')
    expect(result.stdout).toContain('Scanned 2 Markdown files; checked 2 links; skipped 0 external links.')
    expect(result.stderr).toBe('')
  })

  it('emits one JSON report object and returns 0 for a clean scan', () => {
    const root = makeRepository({ 'AGENTS.md': '[external](https://example.test)\n' })

    const result = captureCli(['--json'], root)

    expect(result.exitCode).toBe(0)
    expect(result.stderr).toBe('')
    expect(JSON.parse(result.stdout)).toMatchObject({
      findings: [],
      scanErrors: [],
      counts: { filesScanned: 1, linksFound: 1, linksChecked: 0, linksSkipped: 1 },
    })
  })

  it('accepts repeatable excludes and returns 2 for invalid arguments or incomplete scans', () => {
    const root = makeRepository({
      'AGENTS.md': '[bad](missing.md)\n',
      'skip.md': '[bad](missing-too.md)\n',
    })

    const excluded = captureCli(['--exclude', 'AGENTS.md', '--exclude', 'skip.md'], root)
    expect(excluded.exitCode).toBe(0)
    expect(excluded.stdout).toContain('Scanned 0 Markdown files')

    const invalid = captureCli(['--unknown'], root)
    expect(invalid.exitCode).toBe(2)
    expect(invalid.stderr).toContain('unknown option')

    const missingInput = captureCli(['missing.md'], root)
    expect(missingInput.exitCode).toBe(2)
    expect(missingInput.stdout).toContain('input-path-not-found')

    const invalidGlob = captureCli(['--exclude', '['], root)
    expect(invalidGlob.exitCode).toBe(2)
    expect(invalidGlob.stdout).toContain('invalid-exclude-glob')

    const incomplete = captureCli([], tmpdir())
    expect(incomplete.exitCode).toBe(2)
    expect(incomplete.stdout).toContain('not-a-git-repository')
  })
})
