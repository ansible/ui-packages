import path from 'node:path'

export const changesetWriteGuidance =
  'Do not write Changeset fragments by hand. Run `npm run changesets:add` and follow the CLI prompts.'

const fragmentPath = /(?<![\w.-])\.changeset[\\/][^\\/\s"'`]+\.md(?:$|[\s"'`)])/i
const patchFile = /^\s*\*\*\*\s+(?:(?:Add|Update|Delete)\s+File|Move to):\s*(.*?)\s*$/gm
const embeddedCommand = /(?:cmd|command)\s*:\s*(['"])(.*?)\1/gs
const safeShell =
  /^\s*(?:git\s+(?:status|diff|show|log|ls-files|add)\b|(?:ls|cat|head|tail|less|more|sed|rg|grep|stat|file|wc)\b)/i
const shellControl = /[;&|<>`]|\$\(/

export function isChangesetMarkdownPath(filePath: string, cwd = '.'): boolean {
  const normalized = filePath.replaceAll('\\', '/')
  const segments = normalized.split('/')
  if (segments.at(-2) === '.changeset' && path.posix.extname(segments.at(-1) ?? '').toLowerCase() === '.md') {
    return true
  }

  const resolved = path.resolve(cwd, filePath)
  return path.basename(path.dirname(resolved)) === '.changeset' && path.extname(resolved).toLowerCase() === '.md'
}

export function patchWritesChangesetMarkdown(patch: string, cwd = '.'): boolean {
  return [...patch.matchAll(patchFile)].some((match) => isChangesetMarkdownPath(match[1].trim(), cwd))
}

export function shellWritesChangesetMarkdown(command: string, cwd = '.'): boolean {
  const referencesFragment = fragmentPath.test(command)
  const writesFromChangesetDirectory = isInsideChangesets(cwd) && /\.md(?:$|\W)/i.test(command)
  const mentionsChangesetDirectory = command.includes('.changeset')

  return (
    (referencesFragment || writesFromChangesetDirectory || mentionsChangesetDirectory) &&
    !isNonwritingShellCommand(command)
  )
}

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

function isInsideChangesets(directory: string): boolean {
  let current = path.resolve(directory)
  while (true) {
    if (path.basename(current) === '.changeset') return true
    const parent = path.dirname(current)
    if (parent === current) return false
    current = parent
  }
}

function isNonwritingShellCommand(command: string): boolean {
  return !shellControl.test(command) && safeShell.test(command)
}
