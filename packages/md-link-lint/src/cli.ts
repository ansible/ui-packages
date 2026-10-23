import { Command, CommanderError } from 'commander'
import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
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
  json: boolean
  exclude: string[]
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
  const scanOptions: ScanOptions = { cwd: io.cwd, paths, exclude: options.exclude }
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
