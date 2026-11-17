import path from 'node:path'

export const changesetWriteGuidance =
  'Do not write Changeset fragments by hand. Run `npm run changesets:add` and follow the CLI prompts.'
export const agentHookTypeScriptGuidance =
  'Write agent hooks in TypeScript. Do not add Bash or Python hook files. Run `npm run tsc:agent-hooks` to check them.'

const fragmentPath = /(?<![\w.-])\.changeset[\\/][^\\/\s"'`]+\.md(?:$|[\s"'`)])/i
const patchFile = /^\s*\*\*\*\s+(?:(?:Add|Update|Delete)\s+File|Move to):\s*(.*?)\s*$/gm
const embeddedCommand = /(?:cmd|command)\s*:\s*(['"])(.*?)\1/gs
const unsupportedAgentHookExtension = /\.(?:sh|bash|py)$/i
const unsupportedAgentHookExtensionReference = /\.(?:sh|bash|py)(?=$|\W)/i
const agentHookDirectoryReference = /(?<![\w.-])\.[^\\/\s"'`]+(?:[\\/][^\\/\s"'`]+)*[\\/]hooks(?:$|[\\/])/i
const safeShell =
  /^\s*(?:git\s+(?:status|diff|show|log|ls-files|add)\b|(?:ls|cat|head|tail|less|more|sed|rg|grep|stat|file|wc|Get-Content|Get-ChildItem|Get-Item|Test-Path|Select-String)\b)/i
const shellControl = /[;&|<>`]|\$\(/

/** Check whether a path names a Markdown fragment inside a Changesets directory. */
export function isChangesetMarkdownPath(filePath: string, cwd = '.'): boolean {
  const normalized = filePath.replaceAll('\\', '/')
  const segments = normalized.split('/')
  if (segments.at(-2) === '.changeset' && path.posix.extname(segments.at(-1) ?? '').toLowerCase() === '.md') {
    return true
  }

  const resolved = path.resolve(cwd, filePath)
  return path.basename(path.dirname(resolved)) === '.changeset' && path.extname(resolved).toLowerCase() === '.md'
}

/** Check whether an editor patch writes a Changeset Markdown fragment. */
export function patchWritesChangesetMarkdown(patch: string, cwd = '.'): boolean {
  return [...patch.matchAll(patchFile)].some((match) => isChangesetMarkdownPath(match[1].trim(), cwd))
}

/** Check whether a shell command may write a Changeset Markdown fragment. */
export function shellWritesChangesetMarkdown(command: string, cwd = '.'): boolean {
  const referencesFragment = fragmentPath.test(command)
  const writesFromChangesetDirectory = isInsideChangesets(cwd) && /\.md(?:$|\W)/i.test(command)
  const mentionsChangesetDirectory = command.includes('.changeset')

  return (
    (referencesFragment || writesFromChangesetDirectory || mentionsChangesetDirectory) &&
    !isNonwritingShellCommand(command)
  )
}

/** Check whether a script source may write a Changeset Markdown fragment. */
export function scriptWritesChangesetMarkdown(source: string): boolean {
  if (!fragmentPath.test(source)) return false
  if (
    /\b(?:apply_patch|applyPatch|writeFile|writeFileSync|appendFile|appendFileSync|write_text|write_bytes|createWriteStream)\s*\(/.test(
      source,
    )
  ) {
    return true
  }

  const commands = [...source.matchAll(embeddedCommand)].map((match) => match[2])
  return commands.length === 0 || commands.some((command) => !isNonwritingShellCommand(command))
}

/** Check whether a path names a Bash or Python file inside an agent hook directory. */
export function isDisallowedAgentHookPath(filePath: string, cwd = '.'): boolean {
  return (
    unsupportedAgentHookExtension.test(filePath) &&
    (isAgentHookPath(filePath) || isAgentHookPath(path.resolve(cwd, filePath)))
  )
}

/** Check whether an editor patch writes a Bash or Python agent hook. */
export function patchWritesDisallowedAgentHook(patch: string, cwd = '.'): boolean {
  return [...patch.matchAll(patchFile)].some((match) => isDisallowedAgentHookPath(match[1].trim(), cwd))
}

/** Check whether a shell command may write a Bash or Python agent hook. */
export function shellWritesDisallowedAgentHook(command: string, cwd = '.'): boolean {
  const mentionsHookDirectory = agentHookDirectoryReference.test(command) || isAgentHookDirectory(cwd)
  return (
    mentionsHookDirectory && unsupportedAgentHookExtensionReference.test(command) && !isNonwritingShellCommand(command)
  )
}

/** Check whether a script source may write a Bash or Python agent hook. */
export function scriptWritesDisallowedAgentHook(source: string, cwd = '.'): boolean {
  const mentionsHookDirectory = agentHookDirectoryReference.test(source) || isAgentHookDirectory(cwd)
  if (!mentionsHookDirectory || !unsupportedAgentHookExtensionReference.test(source)) return false
  if (
    /\b(?:apply_patch|applyPatch|writeFile|writeFileSync|appendFile|appendFileSync|write_text|write_bytes|createWriteStream)\s*\(/.test(
      source,
    )
  ) {
    return true
  }

  const commands = [...source.matchAll(embeddedCommand)].map((match) => match[2])
  return commands.length === 0 || commands.some((command) => shellWritesDisallowedAgentHook(command, cwd))
}

/** Check whether a path is under a hidden agent configuration hooks directory. */
function isDisallowedAgentHookDirectory(directory: string): boolean {
  const segments = directory.replaceAll('\\', '/').split('/').filter(Boolean)
  return segments.some(
    (segment, index) =>
      segment.toLowerCase() === 'hooks' &&
      segments.slice(0, index).some((parent) => parent.startsWith('.') && parent !== '.' && parent !== '..'),
  )
}

/** Check whether a path is a disallowed hook file within an agent hook directory. */
function isAgentHookPath(filePath: string): boolean {
  return unsupportedAgentHookExtension.test(filePath) && isDisallowedAgentHookDirectory(filePath)
}

/** Check whether a directory resolves to an agent hook directory. */
function isAgentHookDirectory(directory: string): boolean {
  return isDisallowedAgentHookDirectory(path.resolve(directory))
}

/** Check whether a directory is inside a Changesets folder. */
function isInsideChangesets(directory: string): boolean {
  let current = path.resolve(directory)
  while (true) {
    if (path.basename(current) === '.changeset') return true
    const parent = path.dirname(current)
    if (parent === current) return false
    current = parent
  }
}

/** Check whether a simple allowlisted shell command only reads repository data. */
function isNonwritingShellCommand(command: string): boolean {
  const writesToOutputFile = /(?:^|\s)["']?--output(?=$|[=\s"'])/i.test(command)
  return !shellControl.test(command) && !writesToOutputFile && safeShell.test(command)
}
