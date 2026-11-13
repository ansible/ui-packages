import path from 'node:path'

const fragmentPath = /(?<![\w.-])\.changeset[\\/][^\\/\s"'`]+\.md(?:$|[\s"'`)])/i
const patchFile = /^\s*\*\*\*\s+(?:(?:Add|Update|Delete)\s+File|Move to):\s*(.*?)\s*$/gm
const embeddedCommand = /(?:cmd|command)\s*:\s*(['"])(.*?)\1/gs
const safeBash =
  /^\s*(?:git\s+(?:status|diff|show|log|ls-files|add)\b|(?:ls|cat|head|tail|less|more|sed|rg|grep|stat|file|wc)\b)/i

const event = JSON.parse(await readStdin())
const toolName = event.tool_name ?? ''
const toolInput = event.tool_input ?? {}
const cwd = event.cwd ?? '.'

const command =
  typeof toolInput === 'string'
    ? toolInput
    : (['command', 'cmd', 'patch', 'code'].map((key) => toolInput[key]).find((value) => typeof value === 'string') ??
      '')

const reason = 'Do not write Changeset fragments by hand. Run `npm run changesets:add` and follow the CLI prompts.'

function readStdin() {
  return new Promise((resolve, reject) => {
    let input = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => (input += chunk))
    process.stdin.on('end', () => resolve(input))
    process.stdin.on('error', reject)
  })
}

function isChangesetFragment(filePath) {
  const normalized = filePath.replaceAll('\\', '/')
  const segments = normalized.split('/')
  return segments.at(-2) === '.changeset' && path.posix.extname(segments.at(-1)).toLowerCase() === '.md'
}

function isInsideChangesets(directory) {
  let current = path.resolve(directory)
  while (true) {
    if (path.basename(current) === '.changeset') return true
    const parent = path.dirname(current)
    if (parent === current) return false
    current = parent
  }
}

function isNonwritingShellCommand(value) {
  return !/[;&|<>`]|\$\(/.test(value) && safeBash.test(value)
}

function deny() {
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
    if (typeof toolInput[key] === 'string') targets.push(toolInput[key])
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
