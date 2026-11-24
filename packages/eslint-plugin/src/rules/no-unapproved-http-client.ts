import { AST_NODE_TYPES } from '@typescript-eslint/types'
import type { Rule } from 'eslint'

import { EXPRESSION_WRAPPER_NODE_TYPES } from '../utils/ast.ts'

type RuleOptions = {
  clientModules?: string[]
  approvedModules?: string[]
  disallowFetch?: boolean
  disallowXMLHttpRequest?: boolean
}

type SourceNode = Rule.Node & { source?: Rule.Node }
type StringValueNode = Rule.Node & { value?: unknown }
type ImportDeclarationNode = Rule.Node & {
  importKind?: string
  specifiers?: Array<Rule.Node & { importKind?: string }>
}
type CallExpressionNode = Rule.Node & { callee?: Rule.Node }
type NodeWithParent = Rule.Node & { parent?: Rule.Node }
type ExpressionWrapperNode = Rule.Node & { expression?: Rule.Node }
type AssignmentNode = Rule.Node & {
  left?: Rule.Node
  operator?: string
  right?: Rule.Node
}
type NodeWithOperator = Rule.Node & { operator?: string }
type NodeWithArgument = Rule.Node & { argument?: Rule.Node }
type NodeWithValue = Rule.Node & { value?: Rule.Node }
type VariableDeclaratorNode = Rule.Node & {
  id?: Rule.Node
  init?: Rule.Node
}
type ObjectPatternNode = Rule.Node & { properties?: Rule.Node[] }
type DestructuringPropertyNode = Rule.Node & { key?: Rule.Node; computed?: boolean }
type CalleeNode = Rule.Node & {
  name?: string
  object?: Rule.Node
  property?: Rule.Node
  computed?: boolean
}
type MemberPartNode = Rule.Node & { name?: string }

const defaultClientModules = ['axios', 'cross-fetch', 'got', 'ky', 'node-fetch', 'ofetch', 'superagent', 'undici']

/** Reads a static string from a source or argument node. */
function getStringValue(node: Rule.Node | undefined): string | undefined {
  if (node?.type !== AST_NODE_TYPES.Literal) {
    return undefined
  }

  const value = (node as StringValueNode).value
  return typeof value === 'string' ? value : undefined
}

/** Matches a package name and its subpath imports. */
function matchesModule(source: string, moduleName: string): boolean {
  return source === moduleName || source.startsWith(`${moduleName}/`)
}

/** Finds the scope reference for an identifier. */
function getIdentifierReference(context: Rule.RuleContext, node: Rule.Node) {
  let scope: ReturnType<typeof context.sourceCode.getScope> | null = context.sourceCode.getScope(node)

  while (scope) {
    const reference =
      scope.references.find((candidate) => candidate.identifier === node) ??
      scope.through.find((candidate) => candidate.identifier === node)
    if (reference) {
      return reference
    }
    scope = scope.upper
  }

  return undefined
}

/** Reads an AST node's parent. */
function getParent(node: Rule.Node): Rule.Node | undefined {
  return (node as NodeWithParent).parent
}

/** Checks whether an identifier resolves to a local definition. */
function isLocallyDeclared(context: Rule.RuleContext, node: Rule.Node): boolean {
  return (getIdentifierReference(context, node)?.resolved?.defs.length ?? 0) > 0
}

/** Checks whether an identifier resolves to the global instead of a local binding. */
function isGlobalIdentifier(context: Rule.RuleContext, identifier: Rule.Node | undefined, name: string): boolean {
  return (
    identifier?.type === AST_NODE_TYPES.Identifier &&
    (identifier as MemberPartNode).name === name &&
    !isLocallyDeclared(context, identifier)
  )
}

/** Checks whether an unshadowed identifier is being read as a value. */
function isReadGlobalIdentifier(context: Rule.RuleContext, node: Rule.Node, name: string): boolean {
  if (!isGlobalIdentifier(context, node, name)) {
    return false
  }

  return getIdentifierReference(context, node)?.isRead() ?? false
}

/** Checks whether a reference is only used to query a TypeScript type. */
function isTypeQueryReference(node: Rule.Node): boolean {
  const parentType: string | undefined = getParent(node)?.type
  return parentType === AST_NODE_TYPES.TSTypeQuery
}

/** Checks whether a member uses a named property, including a computed string property. */
function hasMemberName(member: CalleeNode, name: string): boolean {
  if (!member.computed && member.property?.type === AST_NODE_TYPES.Identifier) {
    return (member.property as MemberPartNode).name === name
  }

  return member.computed === true && getStringValue(member.property) === name
}

/** Checks whether a node wraps a syntax-only expression. */
function isExpressionWrapper(node: Rule.Node): boolean {
  const type: string = node.type
  return EXPRESSION_WRAPPER_NODE_TYPES.has(type) || type === AST_NODE_TYPES.TSInstantiationExpression
}

/** Removes syntax-only wrappers from an expression. */
function unwrapExpression(expression: Rule.Node | undefined): Rule.Node | undefined {
  let target = expression
  while (target && isExpressionWrapper(target)) {
    target = (target as ExpressionWrapperNode).expression
  }
  return target
}

/** Checks whether window or globalThis is unshadowed. */
function isGlobalBrowserObject(context: Rule.RuleContext, expression: Rule.Node | undefined): boolean {
  const target = unwrapExpression(expression)
  return isGlobalIdentifier(context, target, 'globalThis') || isGlobalIdentifier(context, target, 'window')
}

/** Checks a property on the global window or globalThis object. */
function isGlobalObjectMember(
  context: Rule.RuleContext,
  expression: Rule.Node | undefined,
  propertyName: string,
): boolean {
  const target = unwrapExpression(expression)
  if (target?.type !== AST_NODE_TYPES.MemberExpression) {
    return false
  }

  const member = target as CalleeNode
  const object = unwrapExpression(member.object)

  return (
    object?.type === AST_NODE_TYPES.Identifier &&
    isGlobalBrowserObject(context, object) &&
    hasMemberName(member, propertyName)
  )
}

/** Checks whether an expression is the target of a write rather than a value read. */
function isWriteTarget(node: Rule.Node): boolean {
  let current = node

  while (true) {
    const parent = getParent(current)
    if (!parent) {
      return false
    }

    if (
      parent.type === AST_NODE_TYPES.ObjectPattern ||
      parent.type === AST_NODE_TYPES.ArrayPattern ||
      (parent.type === AST_NODE_TYPES.RestElement && (parent as NodeWithArgument).argument === current) ||
      (parent.type === AST_NODE_TYPES.AssignmentPattern && (parent as AssignmentNode).left === current) ||
      (parent.type === AST_NODE_TYPES.Property &&
        (parent as NodeWithValue).value === current &&
        getParent(parent)?.type === AST_NODE_TYPES.ObjectPattern)
    ) {
      current = parent
      continue
    }

    if (parent.type === AST_NODE_TYPES.AssignmentExpression) {
      const assignment = parent as AssignmentNode
      return assignment.operator === '=' && assignment.left === current
    }
    if (parent.type === AST_NODE_TYPES.UpdateExpression) {
      return (parent as NodeWithArgument).argument === current
    }
    if (parent.type === AST_NODE_TYPES.UnaryExpression && (parent as NodeWithOperator).operator === 'delete') {
      return (parent as NodeWithArgument).argument === current
    }
    if (parent.type === AST_NODE_TYPES.ForInStatement || parent.type === AST_NODE_TYPES.ForOfStatement) {
      return (parent as AssignmentNode).left === current
    }

    return false
  }
}

/** Checks whether an expression is already reported as a direct call. */
function isDirectCallCallee(node: Rule.Node): boolean {
  let current = node
  let parent = getParent(current)

  while (parent && parent.type !== AST_NODE_TYPES.CallExpression) {
    if (unwrapExpression(parent) !== current) {
      return false
    }
    current = parent
    parent = getParent(current)
  }

  return (
    parent?.type === AST_NODE_TYPES.CallExpression && unwrapExpression((parent as CallExpressionNode).callee) === node
  )
}

/** Finds explicit fetch properties in an object destructuring pattern. */
function getDestructuredFetchProperties(pattern: Rule.Node | undefined): Rule.Node[] {
  if (pattern?.type !== AST_NODE_TYPES.ObjectPattern) {
    return []
  }

  const properties = (pattern as ObjectPatternNode).properties ?? []
  return properties.filter((property) => {
    if (property.type !== AST_NODE_TYPES.Property) {
      return false
    }

    const member = property as DestructuringPropertyNode
    const keyName =
      !member.computed && member.key?.type === AST_NODE_TYPES.Identifier
        ? (member.key as MemberPartNode).name
        : getStringValue(member.key)
    return keyName === 'fetch'
  })
}

/** Checks whether an import only brings in types and cannot issue HTTP requests. */
function isTypeOnlyImport(node: Rule.Node): boolean {
  const declaration = node as ImportDeclarationNode
  return (
    declaration.importKind === 'type' ||
    (declaration.specifiers?.length !== undefined &&
      declaration.specifiers.length > 0 &&
      declaration.specifiers.every((specifier) => specifier.importKind === 'type'))
  )
}

/** Checks whether a call targets the global fetch function. */
function isFetchCall(context: Rule.RuleContext, callee: Rule.Node | undefined): boolean {
  const target = unwrapExpression(callee)

  if (target?.type === AST_NODE_TYPES.Identifier) {
    return isGlobalIdentifier(context, target, 'fetch')
  }

  return isGlobalObjectMember(context, target, 'fetch')
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unapproved HTTP clients and optionally global fetch or XMLHttpRequest use.',
      url: 'https://github.com/ansible/ui-packages/blob/main/packages/eslint-plugin/README.md#rules',
    },
    messages: {
      unapprovedClient: "Use an approved shared HTTP client instead of importing '{{module}}' directly.",
      rawFetch: 'Use an approved shared HTTP client instead of using the global fetch API.',
      rawXMLHttpRequest: 'Use an approved shared HTTP client instead of constructing XMLHttpRequest directly.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          clientModules: {
            type: 'array',
            uniqueItems: true,
            items: { type: 'string', minLength: 1 },
          },
          approvedModules: {
            type: 'array',
            uniqueItems: true,
            items: { type: 'string', minLength: 1 },
          },
          disallowFetch: { type: 'boolean' },
          disallowXMLHttpRequest: { type: 'boolean' },
        },
        additionalProperties: false,
      },
    ],
  },
  /** Builds visitors that check imports and optional raw browser HTTP APIs. */
  create(context) {
    const options = context.options[0] as RuleOptions | undefined
    const clientModules = options?.clientModules ?? defaultClientModules
    const approvedModules = options?.approvedModules ?? []
    const disallowFetch = options?.disallowFetch ?? false
    const disallowXMLHttpRequest = options?.disallowXMLHttpRequest ?? false

    /** Reports a client module unless the consumer has explicitly approved it. */
    function checkModule(node: Rule.Node, source: string | undefined): void {
      if (!source) {
        return
      }

      const clientModule = clientModules.find((candidate) => matchesModule(source, candidate))
      if (clientModule && !approvedModules.some((approvedModule) => matchesModule(source, approvedModule))) {
        context.report({ node, messageId: 'unapprovedClient', data: { module: source } })
      }
    }

    /** Reports fetch properties destructured from the global browser object. */
    function checkDestructuredFetch(pattern: Rule.Node | undefined, source: Rule.Node | undefined): void {
      if (!disallowFetch || !isGlobalBrowserObject(context, source)) {
        return
      }

      for (const property of getDestructuredFetchProperties(pattern)) {
        context.report({ node: property, messageId: 'rawFetch' })
      }
    }

    return {
      /** Checks static imports for unapproved HTTP-client packages. */
      ImportDeclaration(node: Rule.Node) {
        if (!isTypeOnlyImport(node)) {
          checkModule(node, getStringValue((node as SourceNode).source))
        }
      },
      /** Checks dynamic imports for unapproved HTTP-client packages. */
      ImportExpression(node: Rule.Node) {
        checkModule(node, getStringValue((node as SourceNode).source))
      },
      /** Checks references and aliases of the unshadowed global fetch function. */
      Identifier(node: Rule.Node) {
        if (
          disallowFetch &&
          !isTypeQueryReference(node) &&
          isReadGlobalIdentifier(context, node, 'fetch') &&
          !isDirectCallCallee(node)
        ) {
          context.report({ node, messageId: 'rawFetch' })
        }
      },
      /** Checks fetch references through the unshadowed global browser objects. */
      MemberExpression(node: Rule.Node) {
        if (
          disallowFetch &&
          isGlobalObjectMember(context, node, 'fetch') &&
          !isWriteTarget(node) &&
          !isDirectCallCallee(node)
        ) {
          context.report({ node, messageId: 'rawFetch' })
        }
      },
      /** Checks destructuring declarations that alias the global fetch function. */
      VariableDeclarator(node: Rule.Node) {
        const declarator = node as VariableDeclaratorNode
        checkDestructuredFetch(declarator.id, declarator.init)
      },
      /** Checks fetch aliases created through assignment destructuring. */
      AssignmentExpression(node: Rule.Node) {
        const assignment = node as AssignmentNode
        if (assignment.operator === '=') {
          checkDestructuredFetch(assignment.left, assignment.right)
        }
      },
      /** Checks fetch aliases created through defaulted destructuring parameters. */
      AssignmentPattern(node: Rule.Node) {
        const assignment = node as AssignmentNode
        checkDestructuredFetch(assignment.left, assignment.right)
      },
      /** Checks CommonJS imports and optional direct fetch calls. */
      CallExpression(node: Rule.Node) {
        const call = node as CallExpressionNode
        if (isGlobalIdentifier(context, call.callee, 'require')) {
          const argumentsList = (node as Rule.Node & { arguments?: Rule.Node[] }).arguments ?? []
          checkModule(node, getStringValue(argumentsList[0]))
        }

        if (disallowFetch && isFetchCall(context, call.callee)) {
          context.report({ node, messageId: 'rawFetch' })
        }
      },
      /** Checks optional XMLHttpRequest restrictions. */
      NewExpression(node: Rule.Node) {
        const callee = (node as Rule.Node & { callee?: Rule.Node }).callee
        if (
          disallowXMLHttpRequest &&
          (isGlobalIdentifier(context, callee, 'XMLHttpRequest') ||
            isGlobalObjectMember(context, callee, 'XMLHttpRequest'))
        ) {
          context.report({ node, messageId: 'rawXMLHttpRequest' })
        }
      },
    } as unknown as Rule.RuleListener
  },
}

export default rule
