import { execFileSync } from 'node:child_process'

const MAX_GIT_OUTPUT_BYTES = 128 * 1024 * 1024

export class GitCommandError extends Error {
  readonly stderr: string

  /** Include Git arguments, working directory, stderr, and the original cause in the failure. */
  constructor(args: string[], cwd: string, cause: unknown) {
    const error = cause as NodeJS.ErrnoException & { stderr?: string | Buffer }
    const stderr = Buffer.isBuffer(error.stderr) ? error.stderr.toString('utf8') : (error.stderr ?? '')
    const detail = stderr.trim() || error.message || 'Git command failed'
    super(`git ${args.join(' ')} failed in ${cwd}: ${detail}`, { cause })
    this.name = 'GitCommandError'
    this.stderr = stderr
  }
}

/** Run Git without a shell and wrap failures with command context and stderr. */
function runGit(args: string[], cwd: string): Buffer {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'buffer',
      maxBuffer: MAX_GIT_OUTPUT_BYTES,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  } catch (error) {
    throw new GitCommandError(args, cwd, error)
  }
}

/** Ask Git for the working-tree root and reject an empty response. */
export function findRepositoryRoot(startPath: string): string {
  const output = runGit(['rev-parse', '--show-toplevel'], startPath).toString('utf8').trim()
  if (output.length === 0) throw new Error('Git returned an empty repository root')
  return output
}

/** List tracked files present in the working tree and visible untracked files. */
export function listGitFiles(repositoryRoot: string, pathspecs: string[]): string[] {
  const filesArgs = [
    '--literal-pathspecs',
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '--full-name',
    '-z',
    '--',
    ...pathspecs,
  ]
  const deletedArgs = ['--literal-pathspecs', 'ls-files', '--deleted', '--full-name', '-z', '--', ...pathspecs]
  const files = runGit(filesArgs, repositoryRoot).toString('utf8').split('\0').filter(Boolean)
  const deleted = new Set(runGit(deletedArgs, repositoryRoot).toString('utf8').split('\0').filter(Boolean))
  return files.filter((path) => !deleted.has(path))
}
