import { existsSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const ignoredConfigDirectories = new Set(['.git', '.nx'])
const unsupportedHookFile = /\.(?:sh|bash|py)$/i

const agentConfigDirectories = readdirSync(repositoryRoot, { withFileTypes: true }).filter(
  (entry) => entry.isDirectory() && entry.name.startsWith('.') && !ignoredConfigDirectories.has(entry.name),
)
const hookDirectories = agentConfigDirectories
  .map((entry) => join(repositoryRoot, entry.name, 'hooks'))
  .filter((directory) => existsSync(directory) && statSync(directory).isDirectory())

const unsupportedFiles = hookDirectories.flatMap((directory) => findUnsupportedFiles(directory))

if (unsupportedFiles.length > 0) {
  process.stderr.write(
    [
      'Agent hook scripts must use TypeScript. Remove or replace these Bash/Python files:',
      ...unsupportedFiles.map((filePath) => `  ${relative(repositoryRoot, filePath)}`),
      'Run `npm run tsc:agent-hooks` to type-check agent hooks.',
      '',
    ].join('\n'),
  )
  process.exitCode = 1
}

function findUnsupportedFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name)
    if (entry.isDirectory()) return findUnsupportedFiles(filePath)
    return unsupportedHookFile.test(entry.name) ? [filePath] : []
  })
}
