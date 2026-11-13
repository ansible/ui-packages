import {
  changesetWriteGuidance,
  isChangesetMarkdownPath,
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
const shouldBlock = ['Write', 'Edit'].includes(toolName)
  ? isChangesetMarkdownPath(getStringInput(toolInput, 'file_path'), cwd)
  : ['Bash', 'PowerShell'].includes(toolName) && shellWritesChangesetMarkdown(getStringInput(toolInput, 'command'), cwd)

if (shouldBlock) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: changesetWriteGuidance,
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
