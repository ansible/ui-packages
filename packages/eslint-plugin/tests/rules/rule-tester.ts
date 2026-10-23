import { RuleTester } from 'eslint'
import { describe, it } from 'vitest'

RuleTester.describe = describe
RuleTester.it = it

export { RuleTester }
