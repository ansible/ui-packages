import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const ignoredConfigDirectories = new Set(['.git', '.nx'])
const unsupportedHookFile = /\.(?:sh|bash|py)$/i
const runtimeHookSourceFile = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs|sh|bash|py)$/i
const sharedHandlerPath = '.agents/hooks/pre-tool-use.ts'
const policyErrors: string[] = []

const agentConfigDirectories = readdirSync(repositoryRoot, { withFileTypes: true }).filter(
  (entry) => entry.isDirectory() && entry.name.startsWith('.') && !ignoredConfigDirectories.has(entry.name),
)
const hookDirectories = agentConfigDirectories
  .map((entry) => join(repositoryRoot, entry.name, 'hooks'))
  .filter((directory) => existsSync(directory) && statSync(directory).isDirectory())

const unsupportedFiles = hookDirectories.flatMap((directory) => findUnsupportedFiles(directory))

if (unsupportedFiles.length > 0) {
  policyErrors.push(
    [
      'Agent hook scripts must use TypeScript. Remove or replace these Bash/Python files:',
      ...unsupportedFiles.map((filePath) => `  ${relative(repositoryRoot, filePath)}`),
    ].join('\n'),
  )
}

const runtimeHookDirectories = agentConfigDirectories
  .filter((directory) => directory.name !== '.agents')
  .map((directory) => join(repositoryRoot, directory.name, 'hooks'))
const duplicatedHookSources = runtimeHookDirectories
  .filter((directory) => existsSync(directory) && statSync(directory).isDirectory())
  .flatMap((directory) => findFiles(directory, runtimeHookSourceFile))

if (duplicatedHookSources.length > 0) {
  policyErrors.push(
    [
      'Runtime hook directories are for registrations only. Keep hook implementations in .agents/hooks:',
      ...duplicatedHookSources.map((filePath) => `  ${relative(repositoryRoot, filePath)}`),
    ].join('\n'),
  )
}

for (const configPath of ['.claude/settings.json', '.codex/hooks.json']) {
  const config = JSON.parse(readFileSync(join(repositoryRoot, configPath), 'utf8')) as unknown
  if (!hasSingleSharedPreToolUseHandler(config)) {
    policyErrors.push(`${configPath} must register exactly one PreToolUse handler: ${sharedHandlerPath}`)
  }
}

const packageJson = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8')) as unknown
const scripts = isRecord(packageJson) && isRecord(packageJson.scripts) ? packageJson.scripts : {}
if (scripts['tsc:agent-hooks'] !== 'tsc --noEmit --project tsconfig.agent-hooks.json') {
  policyErrors.push('Keep tsc:agent-hooks limited to `tsc --noEmit --project tsconfig.agent-hooks.json`.')
}
if (
  typeof scripts.static !== 'string' ||
  !scripts.static.includes('npm run check:agent-hook-policy') ||
  !scripts.static.includes('npm run tsc:agent-hooks')
) {
  policyErrors.push('The static script must run the policy check and the agent hook type check.')
}

const pullRequestWorkflow = readFileSync(join(repositoryRoot, '.github/workflows/pull-request.yml'), 'utf8')
if (!pullRequestWorkflow.includes('npm run static')) {
  policyErrors.push('The pull-request workflow must run `npm run static`.')
}

if (policyErrors.length > 0) {
  process.stderr.write(`${policyErrors.join('\n\n')}\n`)
  process.exitCode = 1
}

function findUnsupportedFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name)
    if (entry.isDirectory()) return findUnsupportedFiles(filePath)
    return unsupportedHookFile.test(entry.name) ? [filePath] : []
  })
}

function findFiles(directory: string, filePattern: RegExp): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name)
    if (entry.isDirectory()) return findFiles(filePath, filePattern)
    return filePattern.test(entry.name) ? [filePath] : []
  })
}

function hasSingleSharedPreToolUseHandler(config: unknown): boolean {
  if (!isRecord(config) || !isRecord(config.hooks) || !Array.isArray(config.hooks.PreToolUse)) return false

  const handlers = config.hooks.PreToolUse.flatMap((group) =>
    isRecord(group) && Array.isArray(group.hooks) ? group.hooks : [],
  )
  const serializedHandler = handlers.length === 1 ? JSON.stringify(handlers[0]) : undefined
  return typeof serializedHandler === 'string' && serializedHandler.includes(sharedHandlerPath)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
