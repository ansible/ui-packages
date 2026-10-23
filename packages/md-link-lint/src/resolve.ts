import { fileURLToPath, pathToFileURL } from 'node:url'
import { resolve, sep } from 'node:path'
import { isRealPathWithinRepository } from './paths.js'

export type LocalTarget = {
  path: string
  fragment: string | null
}

export type LinkResolution =
  | { kind: 'skip' }
  | { kind: 'local'; target: LocalTarget }
  | { kind: 'outside-repository' }
  | { kind: 'malformed-path'; reason: string }
  | { kind: 'malformed-fragment'; reason: string }

/** Resolve a Markdown destination as a URL reference, without making requests. */
export function resolveDestination(
  destination: string,
  sourceAbsolutePath: string,
  repositoryRoot: string,
): LinkResolution {
  if (/^[A-Za-z][A-Za-z\d+.-]*:/.test(destination) || destination.startsWith('//')) {
    return { kind: 'skip' }
  }

  const hashIndex = destination.indexOf('#')
  const beforeFragment = hashIndex < 0 ? destination : destination.slice(0, hashIndex)
  const rawFragment = hashIndex < 0 ? null : destination.slice(hashIndex + 1)
  const queryIndex = beforeFragment.indexOf('?')
  const pathReference = queryIndex < 0 ? beforeFragment : beforeFragment.slice(0, queryIndex)

  let resolvedUrl: URL
  try {
    const sourceUrl = pathToFileURL(sourceAbsolutePath)
    if (pathReference.startsWith('/')) {
      const repositoryUrl = pathToFileURL(`${resolve(repositoryRoot)}${sep}`)
      resolvedUrl = new URL(pathReference.replace(/^\/+/, ''), repositoryUrl)
    } else {
      resolvedUrl = new URL(pathReference, sourceUrl)
    }
  } catch (error) {
    return {
      kind: 'malformed-path',
      reason: `path is not a valid URL reference: ${message(error)}`,
    }
  }

  let targetPath: string
  try {
    // Validate the percent escapes before converting the URL path to a filesystem path.
    decodeURIComponent(resolvedUrl.pathname)
    targetPath = fileURLToPath(resolvedUrl)
  } catch (error) {
    return {
      kind: 'malformed-path',
      reason: `path has malformed percent encoding: ${message(error)}`,
    }
  }

  if (!isRealPathWithinRepository(repositoryRoot, targetPath)) return { kind: 'outside-repository' }

  if (rawFragment === null) return { kind: 'local', target: { path: targetPath, fragment: null } }
  if (rawFragment.length === 0) return { kind: 'local', target: { path: targetPath, fragment: '' } }

  try {
    return {
      kind: 'local',
      target: { path: targetPath, fragment: decodeURIComponent(rawFragment) },
    }
  } catch (error) {
    return {
      kind: 'malformed-fragment',
      reason: `fragment has malformed percent encoding: ${message(error)}`,
    }
  }
}

/** Preserve an Error’s message while supporting non-Error thrown values. */
function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
