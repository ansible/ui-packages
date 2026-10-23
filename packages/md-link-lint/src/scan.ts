import { readFileSync, realpathSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { discoverMarkdownFiles } from './discover.js'
import { GitCommandError, findRepositoryRoot } from './git.js'
import { parseMarkdown } from './markdown.js'
import { isMarkdownPath, isRealPathWithinRepository, toRepositoryPath } from './paths.js'
import { resolveDestination } from './resolve.js'
import type { Finding, ParsedMarkdown, ScanError, ScanOptions, ScanReport } from './types.js'

export type { Finding, FindingCode, ScanCounts, ScanError, ScanErrorCode, ScanOptions, ScanReport } from './types.js'

/** Reject unknown options and invalid values before accessing Git or the filesystem. */
function validateOptions(options: unknown): string | null {
  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    return 'scan options must be an object'
  }

  const values = options as Record<string, unknown>
  for (const key of Object.keys(values)) {
    if (key !== 'cwd' && key !== 'paths' && key !== 'exclude') {
      return `unknown scan option: ${JSON.stringify(key)}`
    }
  }
  if (values.cwd !== undefined && typeof values.cwd !== 'string') {
    return 'cwd must be a string'
  }
  for (const key of ['paths', 'exclude']) {
    const value = values[key]
    if (value === undefined) continue
    if (!Array.isArray(value)) return `${key} must be an array of strings`
    for (const [index, item] of value.entries()) {
      if (typeof item !== 'string') return `${key}[${index}] must be a string`
    }
  }
  return null
}

type LoadedMarkdown =
  | { ok: true; parsed: ParsedMarkdown }
  | { ok: false; reason: string; code: 'unreadable' | 'parse-error' }

type TargetStat =
  | { kind: 'missing' }
  | { kind: 'existing'; isFile: boolean; isDirectory: boolean }
  | { kind: 'error'; reason: string }

/** Create fresh counters so separate reports never share mutable scan state. */
const emptyCounts = () => ({
  filesSelected: 0,
  filesScanned: 0,
  linksFound: 0,
  linksChecked: 0,
  linksSkipped: 0,
  anchorChecksSkipped: 0,
})

/** Preserve an Error’s message while supporting non-Error thrown values. */
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/** Return a zero-count incomplete scan when setup fails before file selection. */
function createErrorReport(error: ScanError): ScanReport {
  return { repoRoot: null, findings: [], scanErrors: [error], counts: emptyCounts() }
}

/** Follow symlinks and distinguish missing targets from other filesystem failures. */
function targetStat(path: string): TargetStat {
  try {
    const stats = statSync(path)
    return { kind: 'existing', isFile: stats.isFile(), isDirectory: stats.isDirectory() }
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code
    if (code === 'ENOENT' || code === 'ENOTDIR') return { kind: 'missing' }
    return { kind: 'error', reason: errorMessage(error) }
  }
}

/** Read and parse a document while distinguishing filesystem and Markdown failures. */
function loadMarkdown(path: string): LoadedMarkdown {
  let content: string
  try {
    content = readFileSync(path, 'utf8')
  } catch (error) {
    return { ok: false, code: 'unreadable', reason: errorMessage(error) }
  }

  try {
    return { ok: true, parsed: parseMarkdown(content) }
  } catch (error) {
    return { ok: false, code: 'parse-error', reason: errorMessage(error) }
  }
}

/** Sort findings by source location and destination for deterministic reports. */
function compareFinding(left: Finding, right: Finding): number {
  return (
    compareText(left.sourcePath, right.sourcePath) ||
    left.line - right.line ||
    left.column - right.column ||
    compareText(left.destination, right.destination)
  )
}

/** Sort scan errors by available path, source location, and error code. */
function compareError(left: ScanError, right: ScanError): number {
  return (
    compareText(left.sourcePath ?? left.targetPath ?? '', right.sourcePath ?? right.targetPath ?? '') ||
    (left.line ?? 0) - (right.line ?? 0) ||
    (left.column ?? 0) - (right.column ?? 0) ||
    compareText(left.code, right.code)
  )
}

/** Compare strings by code units so report ordering does not depend on locale. */
function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0
}

/** Scan selected Markdown documents for invalid local file and heading links. */
export function scan(options: ScanOptions = {}): ScanReport {
  const optionsError = validateOptions(options)
  if (optionsError !== null) {
    return createErrorReport({ code: 'invalid-options', reason: optionsError })
  }

  let cwd: string
  try {
    cwd = realpathSync(resolve(options.cwd ?? process.cwd()))
  } catch (error) {
    return createErrorReport({
      code: 'invalid-options',
      reason: `cannot access scan directory: ${errorMessage(error)}`,
    })
  }
  let repositoryRoot: string
  try {
    repositoryRoot = realpathSync(findRepositoryRoot(cwd))
  } catch (error) {
    const notRepository = error instanceof GitCommandError && /not a git repository/i.test(error.stderr)
    return createErrorReport({
      code: notRepository ? 'not-a-git-repository' : 'git-command-failed',
      reason: errorMessage(error),
    })
  }

  const discovery = discoverMarkdownFiles(repositoryRoot, cwd, options.paths ?? [], options.exclude ?? [])
  const report: ScanReport = {
    repoRoot: repositoryRoot,
    findings: [],
    scanErrors: discovery.errors,
    counts: emptyCounts(),
  }
  report.counts.filesSelected = discovery.files.length

  const markdownCache = new Map<string, LoadedMarkdown>()
  const statCache = new Map<string, TargetStat>()
  const selectedDocuments: { path: string; sourcePath: string; parsed: ParsedMarkdown }[] = []

  for (const sourcePath of discovery.files) {
    const absolutePath = resolve(repositoryRoot, sourcePath)
    if (!isRealPathWithinRepository(repositoryRoot, absolutePath)) {
      report.scanErrors.push({
        code: 'source-path-outside-repository',
        sourcePath,
        reason: 'source resolves outside the Git working tree',
      })
      continue
    }
    let loaded = markdownCache.get(absolutePath)
    if (!loaded) {
      loaded = loadMarkdown(absolutePath)
      markdownCache.set(absolutePath, loaded)
    }

    if (!loaded.ok) {
      report.scanErrors.push({
        code: loaded.code === 'unreadable' ? 'unreadable-source' : 'markdown-parse-error',
        sourcePath,
        reason: loaded.reason,
      })
      continue
    }

    report.counts.filesScanned += 1
    report.counts.linksFound += loaded.parsed.links.length
    selectedDocuments.push({ path: absolutePath, sourcePath, parsed: loaded.parsed })
  }

  /** Cache filesystem results for targets shared by multiple link occurrences. */
  function getTargetStats(absolutePath: string): TargetStat {
    const cached = statCache.get(absolutePath)
    if (cached) return cached
    const result = targetStat(absolutePath)
    statCache.set(absolutePath, result)
    return result
  }

  /** Reuse parsed documents, including selected sources, for repeated anchor checks. */
  function getMarkdown(absolutePath: string): LoadedMarkdown {
    const cached = markdownCache.get(absolutePath)
    if (cached) return cached
    const loaded = loadMarkdown(absolutePath)
    markdownCache.set(absolutePath, loaded)
    return loaded
  }

  for (const source of selectedDocuments) {
    for (const link of source.parsed.links) {
      const resolution = resolveDestination(link.destination, source.path, repositoryRoot)
      if (resolution.kind === 'skip') {
        report.counts.linksSkipped += 1
        continue
      }

      report.counts.linksChecked += 1
      if (resolution.kind === 'outside-repository') {
        report.findings.push({
          sourcePath: source.sourcePath,
          line: link.line,
          column: link.column,
          destination: link.destination,
          code: 'outside-repository-link',
          reason: 'target resolves outside the Git working tree',
        })
        continue
      }
      if (resolution.kind === 'malformed-path') {
        report.findings.push({
          sourcePath: source.sourcePath,
          line: link.line,
          column: link.column,
          destination: link.destination,
          code: 'malformed-path-encoding',
          reason: resolution.reason,
        })
        continue
      }
      if (resolution.kind === 'malformed-fragment') {
        report.findings.push({
          sourcePath: source.sourcePath,
          line: link.line,
          column: link.column,
          destination: link.destination,
          code: 'malformed-fragment-encoding',
          reason: resolution.reason,
        })
        continue
      }

      const targetPath = resolution.target.path
      const target = getTargetStats(targetPath)
      if (target.kind === 'missing') {
        report.findings.push({
          sourcePath: source.sourcePath,
          line: link.line,
          column: link.column,
          destination: link.destination,
          code: 'missing-file',
          reason: 'target does not exist',
        })
        continue
      }
      if (target.kind === 'error') {
        report.scanErrors.push({
          code: 'unreadable-target',
          sourcePath: source.sourcePath,
          line: link.line,
          column: link.column,
          destination: link.destination,
          targetPath: toRepositoryPath(repositoryRoot, targetPath),
          reason: `cannot inspect target: ${target.reason}`,
        })
        continue
      }

      const fragment = resolution.target.fragment
      if (fragment === null || fragment === '') continue
      if (!target.isFile || !isMarkdownPath(targetPath)) {
        report.counts.anchorChecksSkipped += 1
        continue
      }

      const targetMarkdown = getMarkdown(targetPath)
      if (!targetMarkdown.ok) {
        report.scanErrors.push({
          code: targetMarkdown.code === 'unreadable' ? 'unreadable-target' : 'markdown-parse-error',
          sourcePath: source.sourcePath,
          line: link.line,
          column: link.column,
          destination: link.destination,
          targetPath: toRepositoryPath(repositoryRoot, targetPath),
          reason: targetMarkdown.reason,
        })
        continue
      }

      if (!targetMarkdown.parsed.headingAnchors.has(fragment)) {
        const displayPath = toRepositoryPath(repositoryRoot, targetPath)
        report.findings.push({
          sourcePath: source.sourcePath,
          line: link.line,
          column: link.column,
          destination: link.destination,
          code: 'missing-anchor',
          reason: `heading anchor ${JSON.stringify(fragment)} does not exist in ${displayPath}`,
        })
      }
    }
  }

  report.findings.sort(compareFinding)
  report.scanErrors.sort(compareError)
  return report
}
