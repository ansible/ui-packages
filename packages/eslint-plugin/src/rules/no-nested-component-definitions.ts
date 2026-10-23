import { AST_NODE_TYPES } from '@typescript-eslint/types'
import type { Rule } from 'eslint'

import {
  type AstNode,
  EXPRESSION_WRAPPER_NODE_TYPES,
  getChildNodes,
  getNode,
  getText,
  isAstNode,
} from '../utils/ast.ts'

const functionNodeTypes = new Set<string>([
  AST_NODE_TYPES.ArrowFunctionExpression,
  AST_NODE_TYPES.FunctionDeclaration,
  AST_NODE_TYPES.FunctionExpression,
])

const classNodeTypes = new Set<string>([AST_NODE_TYPES.ClassDeclaration, AST_NODE_TYPES.ClassExpression])

const hookNamePattern = /^use[A-Z]/u

/** Checks whether a name follows the React component naming convention. */
function isComponentName(name: string): boolean {
  return /^[A-Z]/.test(name)
}

/** Checks whether an expression can produce a React element. */
function isReactElementExpression(node: AstNode): boolean {
  if (EXPRESSION_WRAPPER_NODE_TYPES.has(node.type)) {
    const expression = getNode(node, 'expression')
    return expression !== undefined && isReactElementExpression(expression)
  }

  switch (node.type) {
    case AST_NODE_TYPES.JSXElement:
    case AST_NODE_TYPES.JSXFragment:
      return true
    case AST_NODE_TYPES.CallExpression:
      return isReactCreateElementCall(getNode(node, 'callee'))
    case AST_NODE_TYPES.AwaitExpression:
      return getNode(node, 'argument') !== undefined && isReactElementExpression(getNode(node, 'argument')!)
    case AST_NODE_TYPES.ConditionalExpression: {
      const consequent = getNode(node, 'consequent')
      const alternate = getNode(node, 'alternate')
      return (
        (consequent !== undefined && isReactElementExpression(consequent)) ||
        (alternate !== undefined && isReactElementExpression(alternate))
      )
    }
    case AST_NODE_TYPES.LogicalExpression: {
      const left = getNode(node, 'left')
      const right = getNode(node, 'right')
      return (
        (left !== undefined && isReactElementExpression(left)) ||
        (right !== undefined && isReactElementExpression(right))
      )
    }
    case AST_NODE_TYPES.SequenceExpression: {
      const expressions = node.expressions
      const lastExpression = Array.isArray(expressions) ? expressions.at(-1) : undefined
      return isAstNode(lastExpression) && isReactElementExpression(lastExpression)
    }
    default:
      return false
  }
}

/** Checks whether a callee names React's createElement function. */
function isReactCreateElementCall(callee: AstNode | undefined): boolean {
  if (!callee) {
    return false
  }

  if (callee.type === AST_NODE_TYPES.Identifier) {
    return getText(callee, 'name') === 'createElement'
  }

  return getReactMemberName(callee) === 'createElement'
}

/** Returns a property name for a non-computed member of the React object. */
function getReactMemberName(node: AstNode | undefined): string | undefined {
  if (node?.type !== AST_NODE_TYPES.MemberExpression || node.computed !== false) {
    return undefined
  }

  const object = getNode(node, 'object')
  const property = getNode(node, 'property')
  if (
    object?.type === AST_NODE_TYPES.Identifier &&
    getText(object, 'name') === 'React' &&
    property?.type === AST_NODE_TYPES.Identifier
  ) {
    return getText(property, 'name')
  }

  return undefined
}

/** Looks for a React element return without entering nested functions or classes. */
function hasReactElementReturn(node: AstNode): boolean {
  if (node.type === AST_NODE_TYPES.ReturnStatement) {
    const argument = getNode(node, 'argument')
    return argument !== undefined && isReactElementExpression(argument)
  }

  if (functionNodeTypes.has(node.type) || classNodeTypes.has(node.type)) {
    return false
  }

  return getChildNodes(node).some(hasReactElementReturn)
}

/** Checks whether a function body can return a React element. */
function functionReturnsReactElement(node: AstNode): boolean {
  const body = getNode(node, 'body')
  if (!body) {
    return false
  }

  return node.type === AST_NODE_TYPES.ArrowFunctionExpression && body.type !== AST_NODE_TYPES.BlockStatement
    ? isReactElementExpression(body)
    : hasReactElementReturn(body)
}

/** Checks whether a callee wraps a component with memo or forwardRef. */
function isComponentWrapper(node: AstNode | undefined): boolean {
  if (node?.type === AST_NODE_TYPES.Identifier) {
    const name = getText(node, 'name')
    return name === 'memo' || name === 'forwardRef'
  }

  const name = getReactMemberName(node)
  return name === 'memo' || name === 'forwardRef'
}

/** Checks whether a node defines a React component. */
function isComponentDefinition(node: AstNode): boolean {
  if (functionNodeTypes.has(node.type)) {
    return functionReturnsReactElement(node)
  }

  if (node.type === AST_NODE_TYPES.CallExpression && isComponentWrapper(getNode(node, 'callee'))) {
    return true
  }

  if (EXPRESSION_WRAPPER_NODE_TYPES.has(node.type)) {
    const expression = getNode(node, 'expression')
    return expression !== undefined && isComponentDefinition(expression)
  }

  return false
}

/** Returns the name bound to a function, falling back to the declaration that holds it. */
function getFunctionName(node: AstNode, parent: AstNode | undefined): string | undefined {
  const ownName = getText(getNode(node, 'id'), 'name')
  if (ownName !== undefined) {
    return ownName
  }

  if (parent?.type === AST_NODE_TYPES.VariableDeclarator) {
    return getText(getNode(parent, 'id'), 'name')
  }

  if (
    parent?.type === AST_NODE_TYPES.Property ||
    parent?.type === AST_NODE_TYPES.MethodDefinition ||
    parent?.type === AST_NODE_TYPES.PropertyDefinition
  ) {
    return getText(getNode(parent, 'key'), 'name')
  }

  return undefined
}

/**
 * Checks whether a function is a React component or hook.
 */
function isComponentOrHook(node: AstNode, parent: AstNode | undefined): boolean {
  if (parent?.type === AST_NODE_TYPES.MethodDefinition || parent?.type === AST_NODE_TYPES.PropertyDefinition) {
    return false
  }

  const name = getFunctionName(node, parent)
  return (name !== undefined && hookNamePattern.test(name)) || isComponentDefinition(node)
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow React function component definitions inside component or hook bodies.',
      url: 'https://github.com/ansible/ui-packages/blob/main/packages/eslint-plugin/README.md#rules',
    },
    messages: {
      noNestedComponentDefinition:
        "Do not define React function components inside a component or hook. '{{name}}' is defined inside a function; move it to module scope and pass data as props.",
    },
    schema: [],
  },
  /** Builds visitors that report nested React function component definitions. */
  create(context) {
    /** Checks whether an AST node sits inside a React component or hook. */
    function isInsideComponentOrHook(node: AstNode): boolean {
      const ancestors = context.sourceCode.getAncestors(node as unknown as Rule.Node) as unknown as AstNode[]

      return ancestors.some(
        (ancestor, index) => functionNodeTypes.has(ancestor.type) && isComponentOrHook(ancestor, ancestors[index - 1]),
      )
    }

    /** Reports a nested component definition. */
    function report(node: AstNode, name: string): void {
      context.report({
        node: node as unknown as Rule.Node,
        messageId: 'noNestedComponentDefinition',
        data: { name },
      })
    }

    /** Reports a nested component when its name, scope, and definition match. */
    function checkNestedComponent(node: AstNode, name: string | undefined, definition: AstNode | undefined): void {
      if (
        name &&
        isComponentName(name) &&
        definition &&
        isInsideComponentOrHook(node) &&
        isComponentDefinition(definition)
      ) {
        report(node, name)
      }
    }

    return {
      /** Reports a nested function declaration when it defines a component. */
      FunctionDeclaration(node: Rule.Node) {
        const candidate = node as unknown as AstNode
        const name = getText(getNode(candidate, 'id'), 'name')
        checkNestedComponent(candidate, name, candidate)
      },
      /** Reports a variable initialized with a nested component. */
      VariableDeclarator(node: Rule.Node) {
        const candidate = node as unknown as AstNode
        const name = getText(getNode(candidate, 'id'), 'name')
        const initializer = getNode(candidate, 'init')
        checkNestedComponent(candidate, name, initializer)
      },
      /** Reports an assignment that defines a nested component. */
      AssignmentExpression(node: Rule.Node) {
        const candidate = node as unknown as AstNode
        const left = getNode(candidate, 'left')
        const name = getText(left, 'name')
        const right = getNode(candidate, 'right')
        if (left?.type === AST_NODE_TYPES.Identifier) {
          checkNestedComponent(candidate, name, right)
        }
      },
    } as unknown as Rule.RuleListener
  },
}

export default rule
