import { AST_NODE_TYPES } from '@typescript-eslint/types'
import type { Rule } from 'eslint'

import { type AstNode, EXPRESSION_WRAPPER_NODE_TYPES, getNode, getNodes } from '../src/utils/ast.ts'

const equalityOperators = new Set(['==', '===', '!=', '!=='])

/** Removes transparent wrappers around an expression. */
function unwrapExpression(node: AstNode | undefined): AstNode | undefined {
  let expression = node
  while (expression && EXPRESSION_WRAPPER_NODE_TYPES.has(expression.type)) {
    expression = getNode(expression, 'expression')
  }
  return expression
}

/** Returns the property name read by a member expression. */
function getPropertyName(node: AstNode): string | undefined {
  const property = getNode(node, 'property')
  if (!property) {
    return undefined
  }

  if (node.computed === true) {
    const value = property.value
    return typeof value === 'string' ? value : undefined
  }

  const name = property.name
  return property.type === AST_NODE_TYPES.Identifier && typeof name === 'string' ? name : undefined
}

/** Checks whether an expression reads an AST type or kind discriminator. */
function isAstDiscriminatorAccess(node: AstNode | undefined): node is AstNode {
  node = unwrapExpression(node)
  if (node?.type !== AST_NODE_TYPES.MemberExpression) {
    return false
  }

  const propertyName = getPropertyName(node)
  return propertyName === 'type' || propertyName === 'kind'
}

/** Checks whether an expression is a string literal. */
function isStringLiteral(node: AstNode | undefined): boolean {
  node = unwrapExpression(node)
  return node?.type === AST_NODE_TYPES.Literal && typeof node.value === 'string'
}

/** Checks whether an AST discriminator is compared with a raw string. */
function hasRawAstDiscriminatorComparison(node: AstNode): boolean {
  if (!equalityOperators.has(String(node.operator))) {
    return false
  }

  const left = getNode(node, 'left')
  const right = getNode(node, 'right')
  return (
    (isAstDiscriminatorAccess(left) && isStringLiteral(right)) ||
    (isAstDiscriminatorAccess(right) && isStringLiteral(left))
  )
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require named constants when comparing AST discriminators.',
    },
    messages: {
      useAstDiscriminators: 'Use a named AST discriminator constant instead of a string literal.',
    },
    schema: [],
  },
  /** Builds visitors that find raw AST discriminator strings. */
  create(context) {
    return {
      /** Reports a comparison between an AST discriminator and a string. */
      BinaryExpression(node: Rule.Node) {
        const candidate = node as unknown as AstNode
        if (hasRawAstDiscriminatorComparison(candidate)) {
          context.report({ node, messageId: 'useAstDiscriminators' })
        }
      },
      /** Reports string cases in a switch on an AST discriminator. */
      SwitchStatement(node: Rule.Node) {
        const candidate = node as unknown as AstNode
        if (!isAstDiscriminatorAccess(getNode(candidate, 'discriminant'))) {
          return
        }

        for (const switchCase of getNodes(candidate, 'cases')) {
          const test = getNode(switchCase, 'test')
          if (isStringLiteral(test)) {
            context.report({
              node: test as unknown as Rule.Node,
              messageId: 'useAstDiscriminators',
            })
          }
        }
      },
    } as unknown as Rule.RuleListener
  },
}

export default rule
