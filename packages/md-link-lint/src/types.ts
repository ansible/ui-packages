export type FindingCode =
  | 'missing-file'
  | 'missing-anchor'
  | 'malformed-path-encoding'
  | 'malformed-fragment-encoding'
  | 'outside-repository-link'

export type Finding = {
  sourcePath: string
  line: number
  column: number
  destination: string
  code: FindingCode
  reason: string
}

export type ScanErrorCode =
  | 'invalid-options'
  | 'invalid-exclude-glob'
  | 'not-a-git-repository'
  | 'git-command-failed'
  | 'input-path-not-found'
  | 'input-path-outside-repository'
  | 'source-path-outside-repository'
  | 'invalid-input-path'
  | 'unreadable-source'
  | 'unreadable-target'
  | 'markdown-parse-error'

export type ScanError = {
  code: ScanErrorCode
  reason: string
  sourcePath?: string
  line?: number
  column?: number
  destination?: string
  targetPath?: string
}

export type ScanCounts = {
  filesSelected: number
  filesScanned: number
  linksFound: number
  linksChecked: number
  linksSkipped: number
  anchorChecksSkipped: number
}

export type ScanReport = {
  repoRoot: string | null
  findings: Finding[]
  scanErrors: ScanError[]
  counts: ScanCounts
}

export type ScanOptions = {
  /** Start path used to locate the Git working tree. Defaults to process.cwd(). */
  cwd?: string
  /** Files or directories to scan, relative to cwd or absolute. Defaults to the repository. */
  paths?: string[]
  /** Repeatable glob patterns matched against repository-relative source paths. */
  exclude?: string[]
}

export type LinkOccurrence = {
  destination: string
  line: number
  column: number
}

export type ParsedMarkdown = {
  links: LinkOccurrence[]
  headingAnchors: Set<string>
}
