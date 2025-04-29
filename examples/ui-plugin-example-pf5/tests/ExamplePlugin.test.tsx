import { isValidPlugin } from '@ansible/ui-plugin-sdk'
import { describe, expect, it } from 'vitest'
import ExamplePlugin from '../src/ExamplePlugin'

describe('ExamplePlugin', () => {
  it('should return the correct plugin configuration', () => {
    const plugin = ExamplePlugin({ lang: 'en', locale: 'en-us' })
    expect(isValidPlugin(plugin)).toBe(true)
  })
})
