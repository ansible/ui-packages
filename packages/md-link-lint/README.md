# md-link-lint

`md-link-lint` checks local file and heading links in Markdown files inside a Git working tree. It is intended for agent context files such as `AGENTS.md`, as well as repository documentation.

## Install and run

The npm install command below works after the first Changesets version PR is
merged and published.

The npm package is named `@ansible/md-link-lint`; its CLI command is `md-link-lint`.

In an independent Ansible repository, use Node.js 22.23.4 or later in the 22.x line, or 24.x and up, plus Git. Run these commands from that repository's working tree:

```sh
npm install --save-dev @ansible/md-link-lint
npx md-link-lint
```

Pass paths and exclusions to select which Markdown files to check:

```sh
npx md-link-lint docs
npx md-link-lint AGENTS.md README.md
npx md-link-lint --exclude 'vendor/**' --exclude 'docs/generated/**'
npx md-link-lint --json
```

To build and run the package from a workspace checkout:

```sh
npm install
npm run build --workspace=packages/md-link-lint
npm exec --workspace=packages/md-link-lint -- md-link-lint
```

With no paths, the command scans the current Git working tree. Paths can name files or directories and are resolved from the current directory. The scan uses working-tree contents, so tracked files include uncommitted edits and eligible untracked files are included. Git ignore rules omit untracked source documents; already tracked documents remain eligible. Tracked Markdown files deleted from the working tree are omitted from discovery; explicitly supplied paths that do not exist still produce an input-path error. Dot directories are included. `.git` metadata is always excluded.

Only `.md` and `.markdown` files are scanned, without regard to extension case. Source exclusions are repeatable globs matched against repository-relative paths. A source can link to any existing target in the working tree, including a Markdown file outside the selected scan paths. The tool requires a Git working tree and does not traverse submodules.

## What is checked

- Relative paths resolve from the linking document. A single-leading-slash path resolves from the repository root.
- Existing files and directories are accepted. Queries are ignored for file checks.
- Markdown heading fragments are checked in the current or linked Markdown document using GitHub-style heading slugs and duplicate suffixes.
- File fragments such as `src/index.ts#L10` receive an existence check; line numbers are not validated.
- Inline links, resolved reference links, images, and Markdown autolinks are extracted with GFM support.
- External URI schemes, including `file:`, protocol-relative destinations, and links inside code or embedded HTML are skipped. The tool never makes HTTP requests.

It does not check site routes, infer extensions or index documents, validate custom HTML anchors, parse MDX or wiki links, or modify linked files. Undefined reference-like prose is not treated as an error.

## Output and exit codes

Text output lists findings in source path, line, and column order, then prints a summary with checked links and skipped external links. The skipped count includes URI schemes such as `https:` and `file:`, and protocol-relative destinations. `--json` writes one JSON report object to stdout. A scan with no selected Markdown files succeeds with zero counts.

- `0`: scan completed with no invalid local links.
- `1`: scan completed and found invalid local links.
- `2`: invalid arguments or an incomplete scan, such as an unreadable source or a path outside a Git working tree.

## Programmatic API

```ts
import { scan } from '@ansible/md-link-lint'

const report = scan({
  cwd: process.cwd(),
  paths: ['AGENTS.md', '.agents'],
  exclude: ['.agents/generated/**'],
})
```

`scan(options)` returns a `ScanReport` with the repository root, sorted findings, scan errors, and counts for selected/scanned files, discovered/checked/skipped links, and skipped anchor checks. It does not print output or set process exit codes.

## Runtime

Node.js 22.23.4 or later in the 22.x line, or 24.x and up, is required.
