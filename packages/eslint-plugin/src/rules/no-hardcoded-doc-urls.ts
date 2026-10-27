import type { Rule } from 'eslint'

import { createStringLiteralVisitor, visitStringValue } from '../utils/string-value.ts'

type RuleOptions = {
  prefixes?: string[]
}

type TemplateLiteralNode = Rule.Node & {
  expressions?: unknown[]
  quasis?: Array<{ value?: { cooked?: string | null; raw?: string } }>
}

/** Checks whether a string begins with a configured documentation URL prefix. */
function startsWithDocPrefix(value: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => {
    if (!value.startsWith(prefix)) {
      return false
    }

    return prefix.endsWith('/') || '/?#'.includes(value[prefix.length] ?? '')
  })
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hard-coded documentation URLs that should use a shared link helper.',
      url: 'https://github.com/ansible/ui-packages/blob/main/packages/eslint-plugin/README.md#rules',
    },
    messages: {
      noHardcodedDocUrl:
        "Don't hard-code this documentation URL. Use your project's shared documentation link helper or registry.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          prefixes: {
            type: 'array',
            minItems: 1,
            uniqueItems: true,
            items: { type: 'string', minLength: 1 },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  /** Builds visitors that report configured documentation URLs in code strings. */
  create(context) {
    const options = context.options[0] as RuleOptions | undefined
    const prefixes = options?.prefixes ?? []

    /** Reports a string value when it begins with a configured documentation URL prefix. */
    function reportHardcodedDocUrl(node: Rule.Node, value: string): void {
      if (startsWithDocPrefix(value, prefixes)) {
        context.report({ node, messageId: 'noHardcodedDocUrl' })
      }
    }

    return {
      ...createStringLiteralVisitor(reportHardcodedDocUrl),
      /** Checks static templates and templates with a fixed documentation origin. */
      TemplateLiteral(node: Rule.Node) {
        const template = node as TemplateLiteralNode
        const quasis = template.quasis ?? []
        const value =
          template.expressions?.length === 0
            ? quasis.map((quasi) => quasi.value?.cooked ?? quasi.value?.raw ?? '').join('')
            : (quasis[0]?.value?.cooked ?? quasis[0]?.value?.raw)
        visitStringValue(node, value, reportHardcodedDocUrl)
      },
    } as unknown as Rule.RuleListener
  },
}

export default rule
