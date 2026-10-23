import GithubSlugger from 'github-slugger'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'
import type { LinkOccurrence, ParsedMarkdown } from './types.js'

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

/** Read one-based source coordinates from a Markdown syntax tree node. */
function position(node: AstNode): { line: number; column: number } {
  const line = node.position?.start?.line
  const column = node.position?.start?.column
  return {
    line: Number.isInteger(line) && (line ?? 0) > 0 ? (line as number) : 1,
    column: Number.isInteger(column) && (column ?? 0) > 0 ? (column as number) : 1,
  }
}

/** Parse links and GitHub-style heading anchors from one Markdown document. */
export function parseMarkdown(content: string): ParsedMarkdown {
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

  const slugger = new GithubSlugger()
  const headingAnchors = new Set<string>()
  for (const node of nodes) {
    if (node.type === 'heading') headingAnchors.add(slugger.slug(headingText(node)))
  }

  return { links, headingAnchors }
}
