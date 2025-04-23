import { IntegrationType, isValidIntegrationType } from './IntegrationType'
import { isValidNavigation, Navigation } from './Navigation'

/**
 * Represents an integration within the system.
 */
export type Integration = Navigation

/**
 * Determines if the provided value is a valid `Integration` object.
 *
 * This function performs a series of checks to ensure that the input meets
 * the requirements of the `Integration` type. It verifies that the input is
 * an object, contains a `type` property, and that the `type` is a valid
 * integration type. Additional validation is performed based on the specific
 * `type` of the integration.
 *
 * @param integration - The value to be checked.
 * @returns A boolean indicating whether the input is a valid `Integration`.
 */
export function isValidIntegration(integration: unknown): integration is Integration {
  if (typeof integration !== 'object' || integration === null) {
    return false
  }
  if (!('type' in integration)) {
    return false
  }
  if (!isValidIntegrationType(integration.type)) {
    return false
  }
  switch (integration.type) {
    case IntegrationType.Navigation:
      return isValidNavigation(integration)
  }
}

/**
 * Checks if the provided value is a valid array of `Integration` objects.
 *
 * This function verifies that the input is an array and that each element
 * in the array satisfies the `Integration` type by using the `isValidIntegration` function.
 *
 * @param integrations - The value to be checked.
 * @returns A boolean indicating whether the input is a valid array of `Integration` objects.
 */
export function isValidIntegrationArray(integrations: unknown): integrations is Integration[] {
  if (!Array.isArray(integrations)) {
    return false
  }
  for (const integration of integrations) {
    if (!isValidIntegration(integration)) {
      return false
    }
  }
  return true
}
