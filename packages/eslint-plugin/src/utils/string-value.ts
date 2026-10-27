import type { Rule } from 'eslint'

type StringValueCallback = (node: Rule.Node, value: string) => void
type StringValueNode = Rule.Node & { value?: unknown }

/** Calls a callback when an AST value is a string. */
export function visitStringValue(node: Rule.Node, value: unknown, callback: StringValueCallback): void {
  if (typeof value === 'string') {
    callback(node, value)
  }
}

/** Creates a literal visitor that passes string values to a callback. */
export function createStringLiteralVisitor(callback: StringValueCallback): Pick<Rule.RuleListener, 'Literal'> {
  return {
    /** Passes string literal values to the callback. */
    Literal(node: Rule.Node) {
      visitStringValue(node, (node as StringValueNode).value, callback)
    },
  }
}
