import { describe, expect, it } from 'vitest'
import { Integration, IntegrationType, isValidPlugin, Plugin } from '../src'

describe('isValidPlugin', () => {
  it('should return false for non-object input', () => {
    expect(isValidPlugin(null)).toBe(false)
    expect(isValidPlugin(undefined)).toBe(false)
    expect(isValidPlugin(42)).toBe(false)
    expect(isValidPlugin('string')).toBe(false)
    expect(isValidPlugin([])).toBe(false)
  })

  it('should return false if required properties are missing', () => {
    expect(isValidPlugin({})).toBe(false)
    expect(isValidPlugin({ id: 'plugin1' })).toBe(false)
    expect(isValidPlugin({ id: 'plugin1', version: '1.0.0' })).toBe(false)
    expect(isValidPlugin({ id: 'plugin1', integrations: [] })).toBe(false)
  })

  it('should return false if properties have incorrect types', () => {
    expect(isValidPlugin({ id: 123, version: '1.0.0', integrations: [] })).toBe(false)
    expect(isValidPlugin({ id: 'plugin1', version: 123, integrations: [] })).toBe(false)
    expect(isValidPlugin({ id: 'plugin1', version: '1.0.0', integrations: 'not-an-array' })).toBe(false)
  })

  it('should return false if integrations array is invalid', () => {
    const invalidIntegration = { name: 'invalid' } // Assuming Integration requires more properties
    expect(isValidPlugin({ id: 'plugin1', version: '1.0.0', integrations: [invalidIntegration] })).toBe(false)
  })

  it('should return true for a valid Plugin object', () => {
    const validIntegration: Integration = {
      id: 'integration1',
      type: IntegrationType.Navigation,
      label: 'Integration 1',
      path: '/integration1',
    } // Adjust based on Integration definition
    const validPlugin: Plugin = {
      id: 'plugin1',
      version: '1.0.0',
      integrations: [validIntegration],
    }
    expect(isValidPlugin(validPlugin)).toBe(true)
  })
})
