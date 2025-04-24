import { describe, expect, it } from 'vitest'
import { isValidIntegration, isValidIntegrationArray } from './Integration'
import { IntegrationType } from './IntegrationType'
import { Navigation } from './Navigation'

describe('isValidIntegration', () => {
  it('should return false for non-object values', () => {
    expect(isValidIntegration(null)).toBe(false)
    expect(isValidIntegration(undefined)).toBe(false)
    expect(isValidIntegration(42)).toBe(false)
    expect(isValidIntegration('string')).toBe(false)
    expect(isValidIntegration(true)).toBe(false)
  })

  it('should return false for objects without a type property', () => {
    expect(isValidIntegration({})).toBe(false)
    expect(isValidIntegration({ name: 'test' })).toBe(false)
  })

  it('should return false for objects with an invalid type property', () => {
    expect(isValidIntegration({ type: 'invalidType' })).toBe(false)
  })

  it('should return true for valid Navigation integration', () => {
    const validNavigation: Navigation = {
      id: 'test',
      type: IntegrationType.Navigation,
      path: '/test',
    }
    expect(isValidIntegration(validNavigation)).toBe(true)
  })

  it('should return false for invalid Navigation integration', () => {
    const invalidNavigation = {
      type: IntegrationType.Navigation,
      path: 123, // Invalid path type
    }
    expect(isValidIntegration(invalidNavigation)).toBe(false)
  })
})

describe('isValidIntegrationArray', () => {
  it('should return false for non-array values', () => {
    expect(isValidIntegrationArray(null)).toBe(false)
    expect(isValidIntegrationArray(undefined)).toBe(false)
    expect(isValidIntegrationArray(42)).toBe(false)
    expect(isValidIntegrationArray('string')).toBe(false)
    expect(isValidIntegrationArray({})).toBe(false)
  })

  it('should return false if any element in the array is not a valid Integration', () => {
    const invalidArray = [{ type: IntegrationType.Navigation, path: '/valid' }, { type: 'invalidType' }]
    expect(isValidIntegrationArray(invalidArray)).toBe(false)
  })

  it('should return true for an array of valid Integrations', () => {
    const validArray: Navigation[] = [
      { id: 'test1', type: IntegrationType.Navigation, path: '/test1' },
      { id: 'test2', type: IntegrationType.Navigation, path: '/test2' },
    ]
    expect(isValidIntegrationArray(validArray)).toBe(true)
  })
})
