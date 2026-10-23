import { AST_NODE_TYPES, AST_TOKEN_TYPES } from '@typescript-eslint/types'
import type { Rule } from 'eslint'

import { EXPRESSION_WRAPPER_NODE_TYPES } from '../utils/ast.ts'

type CommentToken = {
  type: AST_TOKEN_TYPES.Block
  value: string
}

type RuleOptions = {
  allowTypeTags?: boolean
}

/**
 * Lines tolerated between JSDoc and what it documents. One blank line is
 * allowed because some formatters introduce it; anything further apart reads as
 * an unrelated comment.
 */
const maxLineGapToDoc = 2

const jsDocTagPattern = /(?:^|\s)@[a-z]+\b/iu

const typeTagPattern = /(?:^|\s)@(param|arg|argument|return|returns|type|typedef|template)\b/iu

/** Finds the declaration that should carry a function's JSDoc comment. */
function getDocumentationTarget(node: Rule.Node, context: Rule.RuleContext): Rule.Node | undefined {
  const ancestors = context.sourceCode.getAncestors(node)
  let parentIndex = ancestors.length - 1
  while (parentIndex >= 0 && EXPRESSION_WRAPPER_NODE_TYPES.has(ancestors[parentIndex]?.type ?? '')) {
    parentIndex -= 1
  }
  const parent = ancestors[parentIndex]

  if (node.type === AST_NODE_TYPES.FunctionDeclaration) {
    return parent?.type === AST_NODE_TYPES.ExportDefaultDeclaration ||
      parent?.type === AST_NODE_TYPES.ExportNamedDeclaration
      ? (parent as unknown as Rule.Node)
      : node
  }

  if (node.type !== AST_NODE_TYPES.ArrowFunctionExpression && node.type !== AST_NODE_TYPES.FunctionExpression) {
    return undefined
  }

  if (!parent) {
    return undefined
  }

  if (
    parent.type === AST_NODE_TYPES.Property ||
    parent.type === AST_NODE_TYPES.MethodDefinition ||
    parent.type === AST_NODE_TYPES.PropertyDefinition ||
    parent.type === AST_NODE_TYPES.AssignmentExpression
  ) {
    return parent as unknown as Rule.Node
  }

  if (parent.type === AST_NODE_TYPES.VariableDeclarator) {
    const declaration = context.sourceCode.getAncestors(parent).at(-1)
    if (declaration?.type === AST_NODE_TYPES.VariableDeclaration) {
      const exportDeclaration = context.sourceCode.getAncestors(declaration).at(-1)
      return exportDeclaration?.type === AST_NODE_TYPES.ExportDefaultDeclaration ||
        exportDeclaration?.type === AST_NODE_TYPES.ExportNamedDeclaration
        ? (exportDeclaration as unknown as Rule.Node)
        : (declaration as unknown as Rule.Node)
    }
  }

  return undefined
}

/** Checks whether a comment sits close enough to what it documents. */
function isCloseEnough(commentEndLine: number | undefined, startLine: number | undefined): boolean {
  return commentEndLine !== undefined && startLine !== undefined && startLine - commentEndLine <= maxLineGapToDoc
}

/** Returns an adjacent JSDoc comment for a declaration. */
function findJsDoc(target: Rule.Node, context: Rule.RuleContext): CommentToken | undefined {
  let startLine = target.loc?.start.line
  let token = context.sourceCode.getTokenBefore(target, { includeComments: true })

  // Line comments such as `// eslint-disable-next-line` often sit between JSDoc
  // and the declaration it documents, so step over them before giving up.
  while (token?.type === AST_TOKEN_TYPES.Line) {
    if (!isCloseEnough(token.loc?.end.line, startLine)) {
      return undefined
    }

    startLine = token.loc?.start.line
    token = context.sourceCode.getTokenBefore(token, { includeComments: true })
  }

  if (
    token?.type !== AST_TOKEN_TYPES.Block ||
    !token.value.startsWith('*') ||
    !isCloseEnough(token.loc?.end.line, startLine)
  ) {
    return undefined
  }

  return { type: AST_TOKEN_TYPES.Block, value: token.value }
}

/** Strips leading comment markers so JSDoc can be scanned as plain text. */
function getCommentText(comment: CommentToken): string {
  return comment.value
    .split(/\r?\n/u)
    .map((line) => line.replace(/^\s*\* ?/u, ''))
    .join('\n')
}

/** Extracts the descriptive prose before any JSDoc tags. */
function getDescription(comment: CommentToken): string {
  return getCommentText(comment).trim().split(jsDocTagPattern, 1)[0]?.trim() ?? ''
}

/** Checks whether JSDoc repeats type information from a TypeScript signature. */
function hasRedundantTypeTags(comment: CommentToken): boolean {
  return typeTagPattern.test(getCommentText(comment))
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require descriptive JSDoc for named functions.',
      url: 'https://github.com/ansible/ui-packages/blob/main/packages/eslint-plugin/README.md#rules',
    },
    messages: {
      missingDescription: 'Add a short JSDoc description that explains what this function does.',
      redundantTypeInformation: 'Do not repeat TypeScript types or signature details in JSDoc.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          allowTypeTags: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  /** Builds a visitor that checks named functions for useful JSDoc. */
  create(context) {
    const allowTypeTags = (context.options[0] as RuleOptions | undefined)?.allowTypeTags ?? true
    const checkedTargets = new Set<Rule.Node>()

    /** Reports missing descriptions and, when enabled, repeated signature details. */
    function checkFunction(node: Rule.Node): void {
      const target = getDocumentationTarget(node, context)

      // One declaration can hold several functions, as in
      // `const a = () => 1, B = () => 2`, and a single comment documents them
      // all, so each target is only worth reporting once.
      if (!target || checkedTargets.has(target)) {
        return
      }

      checkedTargets.add(target)

      const comment = findJsDoc(target, context)
      if (!comment || getDescription(comment).length === 0) {
        context.report({ node: target, messageId: 'missingDescription' })
      }

      if (!allowTypeTags && comment && hasRedundantTypeTags(comment)) {
        context.report({ node: target, messageId: 'redundantTypeInformation' })
      }
    }

    return {
      FunctionDeclaration: checkFunction,
      FunctionExpression: checkFunction,
      ArrowFunctionExpression: checkFunction,
    } as unknown as Rule.RuleListener
  },
}

export default rule
