import path from 'node:path'

type HookEvent = {
  tool_name?: string
  tool_input?: unknown
  cwd?: string
}

type ToolArguments = Record<string, unknown>

const fragmentPath = /(?<![\w.-])\.changeset[\\/][^\\/\s"'`]+\.md(?:$|[\s"'`)])/i
const patchFile = /^\s*\*\*\*\s+(?:(?:Add|Update|Delete)\s+File|Move to):\s*(.*?)\s*$/gm
const embeddedCommand = /(?:cmd|command)\s*:\s*(['"])(.*?)\1/gs
const safeBash =
  /^\s*(?:git\s+(?:status|diff|show|log|ls-files|add)\b|(?:ls|cat|head|tail|less|more|sed|rg|grep|stat|file|wc)\b)/i

const event = JSON.parse(await readStdin()) as HookEvent
const toolName = event.tool_name ?? ''
const rawToolInput = event.tool_input
const toolInput: ToolArguments =
  rawToolInput !== null && typeof rawToolInput === 'object' ? (rawToolInput as ToolArguments) : {}
const cwd = event.cwd ?? '.'
const command =
  typeof rawToolInput === 'string' ? rawToolInput : getStringInput(toolInput, ['command', 'cmd', 'patch', 'code'])

const reason = 'Do not write Changeset fragments by hand. Run `npm run changesets:add` and follow the CLI prompts.'

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let input = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => (input += chunk))
    process.stdin.on('end', () => resolve(input))
    process.stdin.on('error', reject)
  })
}

function getStringInput(input: ToolArguments, keys: string[]): string {
  for (const key of keys) {
    const value = input[key]
    if (typeof value === 'string') return value
  }
  return ''
}

function isChangesetFragment(filePath: string): boolean {
  const normalized = filePath.replaceAll('\\', '/')
  const segments = normalized.split('/')
  return segments.at(-2) === '.changeset' && path.posix.extname(segments.at(-1) ?? '').toLowerCase() === '.md'
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

function isNonwritingShellCommand(value: string): boolean {
  return !/[;&|<>`]|\$\(/.test(value) && safeBash.test(value)
}

function deny(): void {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  )
}

if (['apply_patch', 'Edit', 'Write'].includes(toolName)) {
  const targets = [...command.matchAll(patchFile)].map((match) => match[1].trim())
  for (const key of ['file_path', 'filePath', 'path', 'filename', 'target']) {
    if (typeof toolInput[key] === 'string') targets.push(toolInput[key] as string)
  }
  if (targets.some(isChangesetFragment)) deny()
} else if (toolName === 'Bash') {
  const referencesFragment = fragmentPath.test(command)
  const changesetDirectoryWrite = isInsideChangesets(cwd) && /\.md(?:$|\W)/i.test(command)
  const mentionsChangesetDirectory = command.includes('.changeset')
  if (
    (referencesFragment || changesetDirectoryWrite || mentionsChangesetDirectory) &&
    !isNonwritingShellCommand(command)
  ) {
    deny()
  }
} else if (['exec', 'functions.exec'].includes(toolName) && fragmentPath.test(command)) {
  if (command.includes('tools.apply_patch(')) {
    deny()
  } else if (
    /\b(?:writeFile|writeFileSync|appendFile|appendFileSync|write_text|write_bytes|createWriteStream)\s*\(/.test(
      command,
    )
  ) {
    deny()
  } else {
    const commands = [...command.matchAll(embeddedCommand)].map((match) => match[2])
    if (commands.length === 0 || commands.some((value) => !isNonwritingShellCommand(value))) deny()
  }
}
