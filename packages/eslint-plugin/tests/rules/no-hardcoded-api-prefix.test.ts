import { RuleTester } from './rule-tester.js'

import rule from '../../src/rules/no-hardcoded-api-prefix.js'

new RuleTester({
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
}).run('no-hardcoded-api-prefix', rule, {
  valid: [
    'const endpoint = awxAPI`/jobs/`;',
    "const endpoint = '/api/controller/v20/jobs/';",
    "const endpoint = '/api/controllers/v2/jobs/';",
    "const endpoint = '/api/controller/v2/jobs/';",
    "const endpoint = '/api/eda/v1/credential_types/';",
    {
      code: "const endpoint = '/service/v1/jobs/';",
      options: [{ roots: { '/api/custom/v1': 'customApi' } }],
    },
  ],
  invalid: [
    {
      code: "const endpoint = '/api/controller/v2/jobs/';",
      options: [{ roots: { '/api/controller/v2': 'awxAPI' } }],
      errors: [
        {
          messageId: 'noHardcodedApiPrefix',
          data: { prefix: '/api/controller/v2', client: 'awxAPI' },
        },
      ],
    },
    {
      code: 'const endpoint = `/api/eda/v1/credential_types/${id}/`;',
      options: [{ roots: { '/api/eda/v1': 'edaAPI' } }],
      errors: [{ messageId: 'noHardcodedApiPrefix', data: { prefix: '/api/eda/v1', client: 'edaAPI' } }],
    },
    {
      code: "const endpoint = '/service/v1/jobs/';",
      options: [{ roots: { '/service/v1': 'serviceApi' } }],
      errors: [
        {
          messageId: 'noHardcodedApiPrefix',
          data: { prefix: '/service/v1', client: 'serviceApi' },
        },
      ],
    },
  ],
})
