import { IntegrationType } from './IntegrationType'

/**
 * Represents a navigation item within the UI plugin SDK.
 *
 * @interface Navigation
 *
 * @property {string} id - A unique identifier for the navigation item.
 * @property {IntegrationType.Navigation} type - The type of integration, specifically for navigation.
 * @property {string} [label] - An optional label for the navigation item, used for display purposes.
 * @property {string} path - The path or route associated with the navigation item.
 * @property {string} [component] - An optional component name associated with the navigation item.
 * @property {string} [parentId] - An optional identifier for the parent navigation item, used for hierarchical structures.
 */
export interface Navigation {
  id: string
  type: IntegrationType.Navigation
  label?: string
  path: string
  component?: string
  parentId?: string
}

/**
 * Determines if the provided object is a valid `Navigation` type.
 *
 * This function performs a series of checks to ensure that the given `integration`
 * object adheres to the expected structure and types of a `Navigation` object.
 *
 * @param integration - The object to validate as a `Navigation` type.
 * @returns A boolean indicating whether the object is a valid `Navigation`.
 */
export function isValidNavigation(integration: unknown): integration is Navigation {
  if (typeof integration !== 'object' || integration === null) {
    return false
  }
  if (!('type' in integration)) {
    return false
  }
  if (integration.type !== IntegrationType.Navigation) {
    return false
  }
  if (!('id' in integration)) {
    return false
  }
  if (typeof integration.id !== 'string') {
    return false
  }
  if ('label' in integration && typeof integration.label !== 'string') {
    return false
  }
  if (!('path' in integration)) {
    return false
  }
  if (typeof integration.path !== 'string') {
    return false
  }
  if ('component' in integration && typeof integration.component !== 'string') {
    return false
  }
  if ('parentId' in integration && typeof integration.parentId !== 'string') {
    return false
  }
  return true
}
