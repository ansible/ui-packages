import {
  agentHookTypeScriptGuidance,
  changesetWriteGuidance,
  isChangesetMarkdownPath,
  isDisallowedAgentHookPath,
  shellWritesDisallowedAgentHook,
  shellWritesChangesetMarkdown,
} from '../../.agents/hooks/changeset-write-policy.ts'

type HookInput = {
  tool_name?: string
  tool_input?: unknown
  cwd?: string
}

type ToolArguments = Record<string, unknown>

const event = JSON.parse(await readStdin()) as HookInput
const toolName = event.tool_name ?? ''
const rawToolInput = event.tool_input
const toolInput: ToolArguments =
  rawToolInput !== null && typeof rawToolInput === 'object' ? (rawToolInput as ToolArguments) : {}
const cwd = event.cwd ?? '.'
let blockReason: string | undefined

if (['Write', 'Edit'].includes(toolName)) {
  const filePath = getStringInput(toolInput, 'file_path')
  if (isChangesetMarkdownPath(filePath, cwd)) blockReason = changesetWriteGuidance
  else if (isDisallowedAgentHookPath(filePath, cwd)) blockReason = agentHookTypeScriptGuidance
} else if (['Bash', 'PowerShell'].includes(toolName)) {
  const command = getStringInput(toolInput, 'command')
  if (shellWritesChangesetMarkdown(command, cwd)) blockReason = changesetWriteGuidance
  else if (shellWritesDisallowedAgentHook(command, cwd)) blockReason = agentHookTypeScriptGuidance
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

function getStringInput(input: ToolArguments, key: string): string {
  const value = input[key]
  return typeof value === 'string' ? value : ''
}
