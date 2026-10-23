import { AST_NODE_TYPES } from '@typescript-eslint/types'
import type { Rule } from 'eslint'

import { type AstNode, getNode, getNodes, getText, IMPORT_KINDS } from '../utils/ast.ts'

/** Returns an identifier's name when the node is an identifier. */
function getName(node: AstNode | undefined): string | undefined {
  if (node?.type !== AST_NODE_TYPES.Identifier) {
    return undefined
  }

  return getText(node, 'name')
}

/** Collects the local names imported by a module. */
function getImportedNames(statements: AstNode[]): Set<string> {
  const names = new Set<string>()

  for (const statement of statements) {
    if (statement.type !== AST_NODE_TYPES.ImportDeclaration) {
      continue
    }

    for (const specifier of getNodes(statement, 'specifiers')) {
      const name = getName(getNode(specifier, 'local'))
      if (name) {
        names.add(name)
      }
    }
  }

  return names
}

/** Checks whether a statement re-exports an imported binding. */
function isReexport(statement: AstNode, importedNames: Set<string>): boolean {
  if (statement.type === AST_NODE_TYPES.ExportAllDeclaration) {
    return true
  }

  if (statement.type === AST_NODE_TYPES.ExportNamedDeclaration) {
    const specifiers = getNodes(statement, 'specifiers')
    if (getNode(statement, 'source')) {
      return specifiers.length > 0
    }

    if (getNode(statement, 'declaration') || specifiers.length === 0) {
      return false
    }

    return specifiers.every((specifier) => {
      const localName = getName(getNode(specifier, 'local'))
      return localName !== undefined && importedNames.has(localName)
    })
  }

  if (statement.type === AST_NODE_TYPES.ExportDefaultDeclaration) {
    const localName = getName(getNode(statement, 'declaration'))
    return localName !== undefined && importedNames.has(localName)
  }

  return false
}

/** Checks whether a module only imports and forwards exports. */
function isBarrelFile(program: AstNode): boolean {
  const statements = getNodes(program, 'body')
  if (statements.length === 0) {
    return false
  }

  const importedNames = getImportedNames(statements)
  let hasReexport = false

  const onlyImportsAndReexports = statements.every((statement) => {
    if (statement.type === AST_NODE_TYPES.ImportDeclaration) {
      return getNodes(statement, 'specifiers').length > 0 || getText(statement, 'importKind') === IMPORT_KINDS.TYPE
    }

    if (isReexport(statement, importedNames)) {
      hasReexport = true
      return true
    }

    return false
  })

  return onlyImportsAndReexports && hasReexport
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow modules that only re-export bindings from other modules.',
      url: 'https://github.com/ansible/ui-packages/blob/main/packages/eslint-plugin/README.md#rules',
    },
    messages: {
      noBarrelFiles: 'Barrel files are not allowed. Import from the module that defines the binding instead.',
    },
    schema: [],
  },
  /** Builds a visitor that reports barrel files. */
  create(context) {
    return {
      /** Reports a module that only forwards exports. */
      Program(node: Rule.Node) {
        if (isBarrelFile(node as unknown as AstNode)) {
          context.report({ node, messageId: 'noBarrelFiles' })
        }
      },
    } as unknown as Rule.RuleListener
  },
}

export default rule
