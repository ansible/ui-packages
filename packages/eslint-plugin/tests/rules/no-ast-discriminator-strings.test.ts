import { RuleTester } from './rule-tester.js'
import parser from '@typescript-eslint/parser'

import rule from '../../eslint-rules/no-ast-discriminator-strings.js'

new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
}).run('no-ast-discriminator-strings', rule, {
  valid: ['node.type === AST_NODE_TYPES.Identifier;', 'record.status === "ready";'],
  invalid: [
    {
      code: 'node.type === "Identifier";',
      errors: [{ messageId: 'useAstDiscriminators' }],
    },
    {
      code: '"method" !== node.kind;',
      errors: [{ messageId: 'useAstDiscriminators' }],
    },
    {
      code: 'node["type"] === "Identifier";',
      errors: [{ messageId: 'useAstDiscriminators' }],
    },
    {
      code: 'node?.kind === ("method" as const);',
      errors: [{ messageId: 'useAstDiscriminators' }],
    },
    {
      code: '(node.type as string) === "Identifier";',
      errors: [{ messageId: 'useAstDiscriminators' }],
    },
    {
      code: 'switch (node.type) { case "Identifier": break; }',
      errors: [{ messageId: 'useAstDiscriminators' }],
    },
    {
      code: 'switch (node.kind) { case "method": break; }',
      errors: [{ messageId: 'useAstDiscriminators' }],
    },
  ],
})
