import { describe, expect, it } from 'vitest'
import { IntegrationType, isValidIntegrationType } from './IntegrationType'

describe('IntegrationType', () => {
  it('should have a Navigation type', () => {
    expect(IntegrationType.Navigation).toBe('navigation')
  })
})

describe('isValidIntegrationType', () => {
  it('should return true for a valid IntegrationType', () => {
    expect(isValidIntegrationType('navigation')).toBe(true)
  })

  it('should return false for an invalid IntegrationType', () => {
    expect(isValidIntegrationType('invalid')).toBe(false)
  })

  it('should return false for a non-string value', () => {
    expect(isValidIntegrationType(123)).toBe(false)
    expect(isValidIntegrationType(null)).toBe(false)
    expect(isValidIntegrationType(undefined)).toBe(false)
    expect(isValidIntegrationType({})).toBe(false)
    expect(isValidIntegrationType([])).toBe(false)
  })
})
