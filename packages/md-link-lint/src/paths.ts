import { realpathSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'

/** Check lexical containment without accepting sibling paths or parent traversal. */
export function isWithinRepository(repositoryRoot: string, absolutePath: string): boolean {
  const pathFromRoot = relative(repositoryRoot, absolutePath)
  return (
    pathFromRoot === '' || (!isAbsolute(pathFromRoot) && pathFromRoot !== '..' && !pathFromRoot.startsWith(`..${sep}`))
  )
}

/** Check an existing path or its nearest existing parent after resolving symlinks. */
export function isRealPathWithinRepository(repositoryRoot: string, absolutePath: string): boolean {
  const absoluteRoot = resolve(repositoryRoot)
  let candidate = resolve(absolutePath)
  if (!isWithinRepository(absoluteRoot, candidate)) return false

  while (true) {
    try {
      return isWithinRepository(absoluteRoot, realpathSync(candidate))
    } catch {
      const parent = dirname(candidate)
      if (parent === candidate) return false
      candidate = parent
    }
  }
}

/** Convert an absolute path to repository-relative POSIX separators. */
export function toRepositoryPath(repositoryRoot: string, absolutePath: string): string {
  return relative(repositoryRoot, absolutePath).split(sep).join('/') || '.'
}

/** Check whether a path has a supported Markdown extension. */
export function isMarkdownPath(path: string): boolean {
  return /\.(?:md|markdown)$/i.test(path)
}
