import { Command, CommanderError } from 'commander'
import { readFileSync, realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { scan } from './scan.js'
import type { ScanError, ScanOptions, ScanReport } from './types.js'

const { version: packageVersion } = createRequire(import.meta.url)('../package.json') as {
  version: string
}

type CliIO = {
  cwd: string
  stdout: (text: string) => void
  stderr: (text: string) => void
}

type CliOptions = {
  config?: string
  json: boolean
  exclude: string[]
}

type ScanProfileOptions = Pick<ScanOptions, 'defaultProfile' | 'targetProfiles'>

/** Read the optional JSON profile configuration, returning a concise CLI diagnostic on failure. */
function readProfileConfig(path: string, cwd: string): { config?: ScanProfileOptions; error?: string } {
  let contents: string
  try {
    contents = readFileSync(resolve(cwd, path), 'utf8')
  } catch (error) {
    return {
      error:
        'cannot read configuration file ' +
        JSON.stringify(path) +
        ': ' +
        (error instanceof Error ? error.message : String(error)),
    }
  }

  let value: unknown
  try {
    value = JSON.parse(contents)
  } catch (error) {
    return {
      error:
        'cannot parse configuration file ' +
        JSON.stringify(path) +
        ': ' +
        (error instanceof Error ? error.message : String(error)),
    }
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { error: 'configuration file must contain a JSON object' }
  }

  const configuration = value as Record<string, unknown>
  for (const key of Object.keys(configuration)) {
    if (key !== 'defaultProfile' && key !== 'targetProfiles') {
      return { error: 'unknown configuration option: ' + JSON.stringify(key) }
    }
  }
  return { config: configuration as ScanProfileOptions }
}

/** Render an incomplete-scan diagnostic with any available source and target locations. */
function formatScanError(error: ScanError): string {
  const location = error.sourcePath
    ? `${error.sourcePath}${error.line ? `:${error.line}:${error.column ?? 1}` : ''}  `
    : ''
  const target = error.targetPath ? ` (${error.targetPath})` : ''
  return `${location}${error.code}${target}  ${error.reason}\n`
}

/** Write each finding and scan error, followed by a compact count summary. */
function printTextReport(report: ScanReport, io: CliIO): void {
  for (const finding of report.findings) {
    io.stdout(`${finding.sourcePath}:${finding.line}:${finding.column}  ${finding.code}  ${finding.destination}\n`)
  }
  for (const error of report.scanErrors) io.stdout(formatScanError(error))
  io.stdout(
    `Scanned ${report.counts.filesScanned} Markdown files; checked ${report.counts.linksChecked} links; skipped ${report.counts.linksSkipped} external links.\n`,
  )
}

/** Give incomplete scans priority over invalid links when choosing the process status. */
function reportExitCode(report: ScanReport): number {
  if (report.scanErrors.length > 0) return 2
  if (report.findings.length > 0) return 1
  return 0
}

/** Run the CLI against supplied arguments and output callbacks. */
export function runCli(argv: string[], io: CliIO): number {
  const program = new Command()
  program
    .name('md-link-lint')
    .description('Check local file and heading links in Markdown files in a Git repository.')
    .version(packageVersion)
    .option('--json', 'emit the scan report as JSON')
    .option('--config <path>', 'load Markdown profiles from a JSON configuration file')
    .option(
      '-e, --exclude <glob>',
      'exclude source Markdown files matching a glob (repeatable)',
      (glob: string, previous: string[]) => [...previous, glob],
      [],
    )
    .argument('[paths...]', 'Git-tracked or visible untracked source files and directories')
    .allowExcessArguments(false)
    .exitOverride()
    .configureOutput({
      /** Route Commander help and version text through the caller’s output callback. */
      writeOut: (text) => io.stdout(text),
      /** Route Commander diagnostics through the caller’s error callback. */
      writeErr: (text) => io.stderr(text),
      /** Preserve Commander’s diagnostic text without adding extra formatting. */
      outputError: (text, write) => write(text),
    })

  try {
    program.parse(argv, { from: 'user' })
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.code === 'commander.helpDisplayed' || error.code === 'commander.version' ? 0 : 2
    }
    io.stderr(`${error instanceof Error ? error.message : String(error)}\n`)
    return 2
  }

  const options = program.opts<CliOptions>()
  const paths = program.args as string[]
  let profileOptions: ScanProfileOptions = {}
  if (options.config !== undefined) {
    const loaded = readProfileConfig(options.config, io.cwd)
    if (loaded.error !== undefined) {
      io.stderr(loaded.error + '\n')
      return 2
    }
    profileOptions = loaded.config ?? {}
  }
  const scanOptions: ScanOptions = { ...profileOptions, cwd: io.cwd, paths, exclude: options.exclude }
  const report = scan(scanOptions)

  if (options.json) io.stdout(`${JSON.stringify(report)}\n`)
  else printTextReport(report, io)
  return reportExitCode(report)
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  process.exitCode = runCli(process.argv.slice(2), {
    cwd: process.cwd(),
    /** Send normal CLI output to the process’s standard output stream. */
    stdout: (text) => process.stdout.write(text),
    /** Send CLI diagnostics to the process’s standard error stream. */
    stderr: (text) => process.stderr.write(text),
  })
}
