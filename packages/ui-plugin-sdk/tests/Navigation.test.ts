import { describe, expect, it } from 'vitest'
import { IntegrationType, isValidNavigation, Navigation } from '../src'

describe('isValidNavigation', () => {
  it('should return true for a valid Navigation object', () => {
    const validNavigation: Navigation = {
      id: 'nav1',
      type: IntegrationType.Navigation,
      label: 'Home',
      path: '/home',
      component: 'HomeComponent',
      parentId: 'parent1',
    }

    expect(isValidNavigation(validNavigation)).toBe(true)
  })

  it('should return false if the object is null', () => {
    expect(isValidNavigation(null)).toBe(false)
  })

  it('should return false if the object is not an object', () => {
    expect(isValidNavigation('not-an-object')).toBe(false)
  })

  it('should return false if type is missing', () => {
    const invalidNavigation = {
      id: 'nav1',
      path: '/home',
    }

    expect(isValidNavigation(invalidNavigation)).toBe(false)
  })

  it('should return false if type is not IntegrationType.Navigation', () => {
    const invalidNavigation = {
      id: 'nav1',
      type: 'InvalidType',
      path: '/home',
    }

    expect(isValidNavigation(invalidNavigation)).toBe(false)
  })

  it('should return false if id is missing', () => {
    const invalidNavigation = {
      type: IntegrationType.Navigation,
      path: '/home',
    }

    expect(isValidNavigation(invalidNavigation)).toBe(false)
  })

  it('should return false if id is not a string', () => {
    const invalidNavigation = {
      id: 123,
      type: IntegrationType.Navigation,
      path: '/home',
    }

    expect(isValidNavigation(invalidNavigation)).toBe(false)
  })

  it('should return false if label is not a string', () => {
    const invalidNavigation = {
      id: 'nav1',
      type: IntegrationType.Navigation,
      label: 123,
      path: '/home',
    }

    expect(isValidNavigation(invalidNavigation)).toBe(false)
  })

  it('should return false if path is missing', () => {
    const invalidNavigation = {
      id: 'nav1',
      type: IntegrationType.Navigation,
    }

    expect(isValidNavigation(invalidNavigation)).toBe(false)
  })

  it('should return false if path is not a string', () => {
    const invalidNavigation = {
      id: 'nav1',
      type: IntegrationType.Navigation,
      path: 123,
    }

    expect(isValidNavigation(invalidNavigation)).toBe(false)
  })

  it('should return false if component is not a string', () => {
    const invalidNavigation = {
      id: 'nav1',
      type: IntegrationType.Navigation,
      path: '/home',
      component: 123,
    }

    expect(isValidNavigation(invalidNavigation)).toBe(false)
  })

  it('should return false if parentId is not a string', () => {
    const invalidNavigation = {
      id: 'nav1',
      type: IntegrationType.Navigation,
      path: '/home',
      parentId: 123,
    }

    expect(isValidNavigation(invalidNavigation)).toBe(false)
  })
})
