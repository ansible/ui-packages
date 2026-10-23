import { realpathSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import picomatch from 'picomatch'
import { listGitFiles } from './git.js'
import { isMarkdownPath, isRealPathWithinRepository, isWithinRepository, toRepositoryPath } from './paths.js'
import type { ScanError } from './types.js'

export type DiscoveryResult = {
  files: string[]
  errors: ScanError[]
}

export class InvalidExcludeGlobError extends Error {
  /** Retain the glob and original cause in the invalid-exclusion diagnostic. */
  constructor(pattern: string, cause: unknown) {
    super(
      `Invalid exclude glob ${JSON.stringify(pattern)}: ${cause instanceof Error ? cause.message : String(cause)}`,
      {
        cause,
      },
    )
    this.name = 'InvalidExcludeGlobError'
  }
}

/** Exclude Git metadata directories at any depth in a repository-relative path. */
function isGitMetadataPath(repositoryPath: string): boolean {
  return repositoryPath.split('/').some((part) => part === '.git')
}

/** Compile exclusions with dotfile support, rejecting negation and malformed patterns. */
function compileExcludes(patterns: string[]): ((path: string) => boolean)[] {
  return patterns.map((pattern) => {
    if (pattern.startsWith('!')) {
      throw new InvalidExcludeGlobError(pattern, new Error('negated patterns are not supported'))
    }
    try {
      return picomatch(pattern, { dot: true, strictBrackets: true })
    } catch (error) {
      throw new InvalidExcludeGlobError(pattern, error)
    }
  })
}

/** Select Git-visible Markdown files from valid inputs and return discovery errors separately. */
export function discoverMarkdownFiles(
  repositoryRoot: string,
  cwd: string,
  inputPaths: string[],
  excludePatterns: string[],
): DiscoveryResult {
  const errors: ScanError[] = []
  const pathspecs: string[] = []

  for (const inputPath of inputPaths) {
    let absolutePath: string
    try {
      absolutePath = resolve(cwd, inputPath)
    } catch (error) {
      errors.push({
        code: 'invalid-input-path',
        reason: error instanceof Error ? error.message : String(error),
      })
      continue
    }

    if (!isWithinRepository(repositoryRoot, absolutePath)) {
      try {
        const realPath = realpathSync(absolutePath)
        if (isWithinRepository(repositoryRoot, realPath)) absolutePath = realPath
      } catch {
        // Keep the original path for the outside-repository or missing-input diagnostic.
      }
      if (!isWithinRepository(repositoryRoot, absolutePath)) {
        errors.push({
          code: 'input-path-outside-repository',
          reason: `input path is outside the Git working tree: ${inputPath}`,
        })
        continue
      }
    }

    if (!isRealPathWithinRepository(repositoryRoot, absolutePath)) {
      errors.push({
        code: 'input-path-outside-repository',
        reason: `input path resolves outside the Git working tree: ${inputPath}`,
      })
      continue
    }

    try {
      statSync(absolutePath)
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      errors.push({
        code: code === 'ENOENT' || code === 'ENOTDIR' ? 'input-path-not-found' : 'invalid-input-path',
        reason: `cannot access input path ${JSON.stringify(inputPath)}: ${error instanceof Error ? error.message : String(error)}`,
      })
      continue
    }

    pathspecs.push(toRepositoryPath(repositoryRoot, absolutePath))
  }

  let excludes: ((path: string) => boolean)[]
  try {
    excludes = compileExcludes(excludePatterns)
  } catch (error) {
    return {
      files: [],
      errors: [
        ...errors,
        {
          code: 'invalid-exclude-glob',
          reason: error instanceof Error ? error.message : String(error),
        },
      ],
    }
  }

  if (inputPaths.length > 0 && pathspecs.length === 0) return { files: [], errors }

  let gitPaths: string[]
  try {
    gitPaths = listGitFiles(repositoryRoot, pathspecs)
  } catch (error) {
    return {
      files: [],
      errors: [
        ...errors,
        {
          code: 'git-command-failed',
          reason: error instanceof Error ? error.message : String(error),
        },
      ],
    }
  }

  const files = [...new Set(gitPaths)]
    .filter((path) => !isGitMetadataPath(path) && isMarkdownPath(path))
    .filter((path) => !excludes.some((matches) => matches(path)))
    .sort()

  return { files, errors }
}
