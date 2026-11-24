import parser from '@typescript-eslint/parser'
import { RuleTester } from './rule-tester.js'

import rule from '../../src/rules/no-unapproved-http-client.js'

new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
}).run('no-unapproved-http-client', rule, {
  valid: [
    "import { useQuery } from '@tanstack/react-query';",
    "fetch('/api/v1/auth/providers');",
    {
      code: "function request(fetch) { fetch('/resource'); }",
      options: [{ disallowFetch: true }],
    },
    {
      code: "function request(fetch) { const alias = fetch; return alias('/resource'); }",
      options: [{ disallowFetch: true }],
    },
    {
      code: "function request(window) { window['fetch']('/resource'); }",
      options: [{ disallowFetch: true }],
    },
    {
      code: 'function request(window) { return window.fetch; }',
      options: [{ disallowFetch: true }],
    },
    {
      code: 'function request(globalThis) { return globalThis.fetch; }',
      options: [{ disallowFetch: true }],
    },
    {
      code: "const fetch = 'custom'; const request = window[fetch];",
      options: [{ disallowFetch: true }],
    },
    {
      code: 'const { fetch } = client;',
      options: [{ disallowFetch: true }],
    },
    {
      code: 'const window = {}; const { fetch } = window;',
      options: [{ disallowFetch: true }],
    },
    {
      code: 'const globalThis = {}; const { fetch } = globalThis;',
      options: [{ disallowFetch: true }],
    },
    {
      code: 'window.fetch = request;',
      options: [{ disallowFetch: true }],
    },
    {
      code: 'const request = fetch;',
    },
    {
      code: 'class XMLHttpRequest {} new XMLHttpRequest();',
      options: [{ disallowXMLHttpRequest: true }],
    },
    {
      code: "import client from '@acme/http-client';",
      options: [{ clientModules: ['@acme/http-client'], approvedModules: ['@acme/http-client'] }],
    },
    {
      code: "import client from 'axios';",
      options: [{ approvedModules: ['axios'] }],
    },
  ],
  invalid: [
    {
      code: "import axios from 'axios';",
      errors: [{ messageId: 'unapprovedClient', data: { module: 'axios' } }],
    },
    {
      code: "import client from 'ky/universal';",
      errors: [{ messageId: 'unapprovedClient', data: { module: 'ky/universal' } }],
    },
    {
      code: "const client = require('got');",
      errors: [{ messageId: 'unapprovedClient', data: { module: 'got' } }],
    },
    {
      code: "fetch('/api/v1/auth/providers');",
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: 'const request = fetch;',
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: 'useClient(fetch);',
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: 'const request = window.fetch;',
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: "const request = window['fetch'];",
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: 'const request = globalThis.fetch;',
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: "useClient(globalThis['fetch']);",
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: 'const request = (window.fetch ||= fallback);',
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: 'const { fetch } = window;',
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: 'const { fetch: request } = globalThis;',
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: "const { ['fetch']: request } = window;",
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: 'let request; ({ fetch: request } = globalThis);',
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: 'function use({ fetch } = window) {}',
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: 'function use({ fetch } = window) { const window = {}; }',
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: "window['fetch']('/api/v1/auth/providers');",
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: "globalThis.fetch('/api/v1/auth/providers');",
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: 'new XMLHttpRequest();',
      options: [{ disallowXMLHttpRequest: true }],
      errors: [{ messageId: 'rawXMLHttpRequest' }],
    },
    {
      code: 'new window.XMLHttpRequest();',
      options: [{ disallowXMLHttpRequest: true }],
      errors: [{ messageId: 'rawXMLHttpRequest' }],
    },
    {
      code: "new globalThis['XMLHttpRequest']();",
      options: [{ disallowXMLHttpRequest: true }],
      errors: [{ messageId: 'rawXMLHttpRequest' }],
    },
  ],
})

new RuleTester({
  languageOptions: {
    parser,
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
}).run('no-unapproved-http-client (TypeScript)', rule, {
  valid: [
    {
      code: 'type Request = typeof fetch;',
      options: [{ disallowFetch: true }],
    },
  ],
  invalid: [
    {
      code: 'type fetch = unknown; const request = fetch;',
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
    {
      code: 'const { fetch } = window as Window;',
      options: [{ disallowFetch: true }],
      errors: [{ messageId: 'rawFetch' }],
    },
  ],
})
