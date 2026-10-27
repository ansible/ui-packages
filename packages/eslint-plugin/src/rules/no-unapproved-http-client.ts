import { AST_NODE_TYPES } from '@typescript-eslint/types'
import type { Rule } from 'eslint'

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

/** Checks whether an identifier is declared in a local scope instead of being global. */
function isLocallyDeclared(context: Rule.RuleContext, node: Rule.Node, name: string): boolean {
  let scope: ReturnType<typeof context.sourceCode.getScope> | null = context.sourceCode.getScope(node)

  while (scope) {
    const variable = scope.set.get(name)
    if (variable && variable.defs.length > 0) {
      return true
    }
    scope = scope.upper
  }

  return false
}

/** Checks whether an identifier resolves to the global instead of a local binding. */
function isGlobalIdentifier(
  context: Rule.RuleContext,
  node: Rule.Node,
  identifier: Rule.Node | undefined,
  name: string,
): boolean {
  return (
    identifier?.type === AST_NODE_TYPES.Identifier &&
    (identifier as MemberPartNode).name === name &&
    !isLocallyDeclared(context, node, name)
  )
}

/** Checks whether a member uses a named property, including a computed string property. */
function hasMemberName(member: CalleeNode, name: string): boolean {
  if (member.property?.type === AST_NODE_TYPES.Identifier) {
    return (member.property as MemberPartNode).name === name
  }

  return member.computed === true && getStringValue(member.property) === name
}

/** Checks a property on the global window or globalThis object. */
function isGlobalObjectMember(
  context: Rule.RuleContext,
  node: Rule.Node,
  expression: Rule.Node | undefined,
  propertyName: string,
): boolean {
  if (expression?.type !== AST_NODE_TYPES.MemberExpression) {
    return false
  }

  const member = expression as CalleeNode
  const object = member.object as MemberPartNode | undefined
  const objectName = object?.name

  return (
    object?.type === AST_NODE_TYPES.Identifier &&
    ['globalThis', 'window'].includes(objectName ?? '') &&
    !isLocallyDeclared(context, node, objectName ?? '') &&
    hasMemberName(member, propertyName)
  )
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
function isFetchCall(context: Rule.RuleContext, node: Rule.Node, callee: Rule.Node | undefined): boolean {
  if (callee?.type === AST_NODE_TYPES.Identifier) {
    return isGlobalIdentifier(context, node, callee, 'fetch')
  }

  return isGlobalObjectMember(context, node, callee, 'fetch')
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow unapproved HTTP clients and optionally direct fetch or XMLHttpRequest use.',
      url: 'https://github.com/ansible/ui-packages/blob/main/packages/eslint-plugin/README.md#rules',
    },
    messages: {
      unapprovedClient: "Use an approved shared HTTP client instead of importing '{{module}}' directly.",
      rawFetch: 'Use an approved shared HTTP client instead of calling fetch() directly.',
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
      /** Checks CommonJS imports and optional direct fetch calls. */
      CallExpression(node: Rule.Node) {
        const call = node as CallExpressionNode
        if (isGlobalIdentifier(context, node, call.callee, 'require')) {
          const argumentsList = (node as Rule.Node & { arguments?: Rule.Node[] }).arguments ?? []
          checkModule(node, getStringValue(argumentsList[0]))
        }

        if (disallowFetch && isFetchCall(context, node, call.callee)) {
          context.report({ node, messageId: 'rawFetch' })
        }
      },
      /** Checks optional XMLHttpRequest restrictions. */
      NewExpression(node: Rule.Node) {
        const callee = (node as Rule.Node & { callee?: Rule.Node }).callee
        if (
          disallowXMLHttpRequest &&
          (isGlobalIdentifier(context, node, callee, 'XMLHttpRequest') ||
            isGlobalObjectMember(context, node, callee, 'XMLHttpRequest'))
        ) {
          context.report({ node, messageId: 'rawXMLHttpRequest' })
        }
      },
    } as unknown as Rule.RuleListener
  },
}

export default rule
