import type { Rule } from 'eslint'

import { createStringLiteralVisitor, visitStringValue } from '../utils/string-value.ts'

type RuleOptions = {
  roots?: Record<string, string>
}

type TemplateElementNode = Rule.Node & { value?: { cooked?: unknown } }

/** Checks for a configured API root followed by a path boundary. */
function includesApiRoot(value: string, root: string): boolean {
  const normalizedRoot = root.replace(/\/+$/u, '')
  if (normalizedRoot.length === 0) {
    return false
  }

  let searchFrom = 0

  while (searchFrom < value.length) {
    const index = value.indexOf(normalizedRoot, searchFrom)
    if (index === -1) {
      return false
    }

    const nextCharacter = value[index + normalizedRoot.length]
    if (nextCharacter === undefined || '/?#'.includes(nextCharacter)) {
      return true
    }

    searchFrom = index + normalizedRoot.length
  }

  return false
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hard-coded API roots that should use a shared API client.',
      url: 'https://github.com/ansible/ui-packages/blob/main/packages/eslint-plugin/README.md#rules',
    },
    messages: {
      noHardcodedApiPrefix: "Don't hard-code the '{{prefix}}' API root. Use the '{{client}}' helper instead.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          roots: {
            type: 'object',
            minProperties: 1,
            propertyNames: { pattern: '[^/]' },
            additionalProperties: { type: 'string', minLength: 1 },
          },
        },
        additionalProperties: false,
      },
    ],
  },
  /** Builds visitors that report configured API roots in string values. */
  create(context) {
    const options = context.options[0] as RuleOptions | undefined
    const roots = Object.entries(options?.roots ?? {})

    /** Reports the first matching configured API root in a string value. */
    function reportHardcodedApiRoot(node: Rule.Node, value: string): void {
      for (const [prefix, client] of roots) {
        if (includesApiRoot(value, prefix)) {
          context.report({ node, messageId: 'noHardcodedApiPrefix', data: { prefix, client } })
          return
        }
      }
    }

    return {
      ...createStringLiteralVisitor(reportHardcodedApiRoot),
      /** Checks template segments for configured API roots. */
      TemplateElement(node: Rule.Node) {
        visitStringValue(node, (node as TemplateElementNode).value?.cooked, reportHardcodedApiRoot)
      },
    } as unknown as Rule.RuleListener
  },
}

export default rule
