import GithubSlugger from 'github-slugger'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import type { LinkOccurrence, MarkdownProfile, ParsedMarkdown } from './types.js'

type AstNode = {
  type: string
  url?: unknown
  identifier?: unknown
  value?: unknown
  alt?: unknown
  children?: AstNode[]
  position?: { start?: { line?: number; column?: number } }
}

const parser = unified().use(remarkParse).use(remarkGfm)

/** Check whether a value is a node from the Markdown syntax tree. */
function isAstNode(value: unknown): value is AstNode {
  return typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
}

/** Return valid child nodes from a Markdown syntax tree node. */
function childNodes(node: AstNode): AstNode[] {
  return Array.isArray(node.children) ? node.children.filter(isAstNode) : []
}

/** Build the visible text used to generate a heading anchor. */
function headingText(node: AstNode): string {
  if (node.type === 'html') return ''
  if (node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') {
    return typeof node.value === 'string' ? node.value : ''
  }
  if (node.type === 'image' || node.type === 'imageReference') {
    return typeof node.alt === 'string' ? node.alt : ''
  }
  return childNodes(node).map(headingText).join('')
}

type PythonMarkdownHeading = {
  text: string
  explicitId?: string
}

/** Read the trailing Python-Markdown attribute list on a heading, when present. */
function pythonMarkdownHeading(node: AstNode): PythonMarkdownHeading {
  const children = childNodes(node)
  const lastChild = children.at(-1)
  if (lastChild?.type !== 'text' || typeof lastChild.value !== 'string') return { text: headingText(node) }

  const attributeList = /[ \t]+\{(?::?[ \t]*)([^{}\n]+)\}[ \t]*$/.exec(lastChild.value)
  if (!attributeList) return { text: headingText(node) }

  const attributeTokens = attributeList[1]?.match(/(?:[^\s=]+=(?:"[^"]*"|'[^']*'|[^\s]+)|[^\s]+)/g) ?? []
  let explicitId: string | undefined
  for (const token of attributeTokens) {
    if (token.startsWith('#')) {
      explicitId = token.slice(1)
      continue
    }

    const idAttribute = /^id=(?:"([^"]*)"|'([^']*)'|([^\s]+))$/.exec(token)
    if (idAttribute) explicitId = idAttribute[1] ?? idAttribute[2] ?? idAttribute[3] ?? ''
  }

  const text = headingText(node)
  return { text: text.slice(0, Math.max(0, text.length - attributeList[0].length)), explicitId }
}

/** Reproduce the default Python-Markdown TOC slug's ASCII normalization. */
function pythonMarkdownSlug(value: string): string {
  const asciiValue = Array.from(value.normalize('NFKD'))
    .filter((character) => (character.codePointAt(0) ?? 0) <= 0x7f)
    .join('')

  return asciiValue
    .replace(/[^A-Za-z0-9_\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, '-')
}

/** Apply Python-Markdown TOC's underscore suffix for empty and duplicate IDs. */
function uniquePythonMarkdownId(id: string, usedIds: Set<string>): string {
  if (!id || usedIds.has(id)) {
    const match = /^(.*)_([0-9]+)$/.exec(id)
    const base = match?.[1] ?? id
    let suffix = match ? Number(match[2]) + 1 : 1
    id = base + '_' + suffix
    while (usedIds.has(id)) {
      suffix += 1
      id = base + '_' + suffix
    }
  }

  usedIds.add(id)
  return id
}

/** Build heading IDs using Python-Markdown's default TOC behavior and heading attr_list IDs. */
function pythonMarkdownHeadingAnchors(nodes: AstNode[]): Set<string> {
  const headings = nodes.filter((node) => node.type === 'heading').map(pythonMarkdownHeading)
  const usedIds = new Set(headings.flatMap((heading) => (heading.explicitId === undefined ? [] : [heading.explicitId])))
  const headingAnchors = new Set<string>()

  for (const heading of headings) {
    const id =
      heading.explicitId === undefined
        ? uniquePythonMarkdownId(pythonMarkdownSlug(heading.text), usedIds)
        : heading.explicitId
    headingAnchors.add(id)
  }

  return headingAnchors
}

/** Read one-based source coordinates from a Markdown syntax tree node. */
function position(node: AstNode): { line: number; column: number } {
  const line = node.position?.start?.line
  const column = node.position?.start?.column
  return {
    line: Number.isInteger(line) && (line ?? 0) > 0 ? (line as number) : 1,
    column: Number.isInteger(column) && (column ?? 0) > 0 ? (column as number) : 1,
  }
}

/** Parse links and heading anchors from one Markdown document. */
export function parseMarkdown(content: string, profile: MarkdownProfile = 'github'): ParsedMarkdown {
  const root = parser.parse(content) as unknown as AstNode
  const definitions = new Map<string, string>()
  const nodes: AstNode[] = []

  /** Collect a node and all of its descendants. */
  function collect(node: AstNode): void {
    nodes.push(node)
    for (const child of childNodes(node)) collect(child)
  }

  collect(root)
  for (const node of nodes) {
    if (
      node.type === 'definition' &&
      typeof node.identifier === 'string' &&
      typeof node.url === 'string' &&
      !definitions.has(node.identifier)
    ) {
      definitions.set(node.identifier, node.url)
    }
  }

  const links: LinkOccurrence[] = []
  for (const node of nodes) {
    let destination: string | undefined
    if ((node.type === 'link' || node.type === 'image') && typeof node.url === 'string') {
      destination = node.url
    } else if (
      (node.type === 'linkReference' || node.type === 'imageReference') &&
      typeof node.identifier === 'string'
    ) {
      destination = definitions.get(node.identifier)
    }

    if (destination === undefined) continue
    const { line, column } = position(node)
    links.push({ destination, line, column })
  }

  let headingAnchors: Set<string>
  if (profile === 'python-markdown') {
    headingAnchors = pythonMarkdownHeadingAnchors(nodes)
  } else {
    const slugger = new GithubSlugger()
    headingAnchors = new Set<string>()
    for (const node of nodes) {
      if (node.type === 'heading') headingAnchors.add(slugger.slug(headingText(node)))
    }
  }

  return { links, headingAnchors }
}
