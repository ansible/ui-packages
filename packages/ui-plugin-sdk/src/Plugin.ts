import { Integration, isValidIntegrationArray } from './Integration'

/**
 * Represents a plugin with a unique identifier, version, and a list of integrations.
 */
export interface Plugin {
  id: string
  version: string
  integrations: Integration[]
}

/**
 * Determines if the given object is a valid `Plugin`.
 *
 * This function performs a series of type checks to ensure that the provided
 * `plugin` object conforms to the expected structure of a `Plugin`. It verifies
 * the presence and types of required properties such as `id`, `version`, and
 * `integrations`.
 *
 * @param plugin - The object to validate as a `Plugin`.
 * @returns A boolean indicating whether the object is a valid `Plugin`.
 */
export function isValidPlugin(plugin: unknown): plugin is Plugin {
  if (typeof plugin !== 'object' || plugin === null) {
    return false
  }
  if (!('id' in plugin)) {
    return false
  }
  if (typeof plugin.id !== 'string') {
    return false
  }
  if (!('version' in plugin)) {
    return false
  }
  if (typeof plugin.version !== 'string') {
    return false
  }
  if (!('integrations' in plugin)) {
    return false
  }
  if (!isValidIntegrationArray(plugin.integrations)) {
    return false
  }
  return true
}
