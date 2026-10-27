import { RuleTester } from './rule-tester.js'

import rule from '../../src/rules/no-hardcoded-doc-urls.js'

new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
}).run('no-hardcoded-doc-urls', rule, {
  valid: [
    "const url = 'https://github.com/ansible/automation';",
    "const copy = 'Read https://docs.ansible.com/guide/ before continuing.';",
    "const docsUrl = useDocLink('workflow-builder');",
    'const url = `https://${host}/guide/`;',
    "const url = 'https://docs.ansible.com/ansible/latest/guide/';",
    "const url = 'https://docs.redhat.com/documentation/ansible/guide/';",
    {
      code: "const url = 'https://docs.example.com/guide/';",
      options: [{ prefixes: ['https://docs.ansible.com/'] }],
    },
  ],
  invalid: [
    {
      code: "const url = 'https://docs.ansible.com/ansible/latest/guide/';",
      options: [{ prefixes: ['https://docs.ansible.com/'] }],
      errors: [{ messageId: 'noHardcodedDocUrl' }],
    },
    {
      code: 'const url = `https://access.redhat.com/documentation/ansible/guide/${version}`;',
      options: [{ prefixes: ['https://access.redhat.com/documentation/'] }],
      errors: [{ messageId: 'noHardcodedDocUrl' }],
    },
    {
      code: "const url = 'https://docs.example.com/guide/';",
      options: [{ prefixes: ['https://docs.example.com/'] }],
      errors: [{ messageId: 'noHardcodedDocUrl' }],
    },
  ],
})
