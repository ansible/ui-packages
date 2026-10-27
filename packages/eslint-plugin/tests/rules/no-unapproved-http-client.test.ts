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
      code: "function request(window) { window['fetch']('/resource'); }",
      options: [{ disallowFetch: true }],
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
