import {
  agentHookTypeScriptGuidance,
  changesetWriteGuidance,
  isChangesetMarkdownPath,
  isDisallowedAgentHookPath,
  patchWritesChangesetMarkdown,
  patchWritesDisallowedAgentHook,
  scriptWritesDisallowedAgentHook,
  scriptWritesChangesetMarkdown,
  shellWritesDisallowedAgentHook,
  shellWritesChangesetMarkdown,
} from '../../.agents/hooks/changeset-write-policy.ts'

type HookEvent = {
  tool_name?: string
  tool_input?: unknown
  cwd?: string
}

type ToolArguments = Record<string, unknown>

const event = JSON.parse(await readStdin()) as HookEvent
const toolName = event.tool_name ?? ''
const rawToolInput = event.tool_input
const toolInput: ToolArguments =
  rawToolInput !== null && typeof rawToolInput === 'object' ? (rawToolInput as ToolArguments) : {}
const cwd = event.cwd ?? '.'
const command =
  typeof rawToolInput === 'string' ? rawToolInput : getStringInput(toolInput, ['command', 'cmd', 'patch', 'code'])

let blockReason: string | undefined

if (['apply_patch', 'Edit', 'Write'].includes(toolName)) {
  const targets: string[] = []
  for (const key of ['file_path', 'filePath', 'path', 'filename', 'target']) {
    if (typeof toolInput[key] === 'string') targets.push(toolInput[key] as string)
  }
  if (patchWritesChangesetMarkdown(command, cwd) || targets.some((target) => isChangesetMarkdownPath(target, cwd))) {
    blockReason = changesetWriteGuidance
  } else if (
    patchWritesDisallowedAgentHook(command, cwd) ||
    targets.some((target) => isDisallowedAgentHookPath(target, cwd))
  ) {
    blockReason = agentHookTypeScriptGuidance
  }
} else if (toolName === 'Bash') {
  if (shellWritesChangesetMarkdown(command, cwd)) blockReason = changesetWriteGuidance
  else if (shellWritesDisallowedAgentHook(command, cwd)) blockReason = agentHookTypeScriptGuidance
} else if (['exec', 'functions.exec'].includes(toolName)) {
  if (scriptWritesChangesetMarkdown(command)) blockReason = changesetWriteGuidance
  else if (scriptWritesDisallowedAgentHook(command, cwd)) blockReason = agentHookTypeScriptGuidance
}

if (blockReason) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: blockReason,
      },
    }),
  )
}

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
