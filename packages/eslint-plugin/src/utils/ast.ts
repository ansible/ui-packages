import { AST_NODE_TYPES } from '@typescript-eslint/types'

export type AstNode = { type: string; [key: string]: unknown }

export const EXPRESSION_WRAPPER_NODE_TYPES: ReadonlySet<string> = new Set([
  AST_NODE_TYPES.ChainExpression,
  AST_NODE_TYPES.TSAsExpression,
  AST_NODE_TYPES.TSNonNullExpression,
  AST_NODE_TYPES.TSSatisfiesExpression,
  AST_NODE_TYPES.TSTypeAssertion,
])

export const IMPORT_KINDS = {
  VALUE: 'value',
  TYPE: 'type',
} as const

/** Checks whether a value has the shape of an AST node. */
export function isAstNode(value: unknown): value is AstNode {
  return typeof value === 'object' && value !== null && 'type' in value && typeof value.type === 'string'
}

/** Returns a child value when it is an AST node. */
export function getNode(node: AstNode, key: string): AstNode | undefined {
  const value = node[key]
  return isAstNode(value) ? value : undefined
}

/** Returns the AST nodes stored in a child array. */
export function getNodes(node: AstNode, key: string): AstNode[] {
  const value = node[key]
  return Array.isArray(value) ? value.filter(isAstNode) : []
}

/** Returns a string value stored on a node. */
export function getText(node: AstNode | undefined, key: string): string | undefined {
  const value = node?.[key]
  return typeof value === 'string' ? value : undefined
}

/** Collects the direct AST children of a node. */
export function getChildNodes(node: AstNode): AstNode[] {
  const children: AstNode[] = []

  for (const [key, value] of Object.entries(node)) {
    if (key === 'parent') {
      continue
    }

    if (Array.isArray(value)) {
      for (const child of value) {
        if (isAstNode(child)) {
          children.push(child)
        }
      }
    } else if (isAstNode(value)) {
      children.push(value)
    }
  }

  return children
}
