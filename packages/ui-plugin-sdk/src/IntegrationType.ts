/**
 * Enum representing the types of integrations available in the system.
 *
 * @enum {string}
 * @property {string} Navigation - Represents an integration type for navigation purposes.
 */
export enum IntegrationType {
  Navigation = 'navigation',
}

/**
 * Checks if the provided value is a valid `IntegrationType`.
 *
 * This function verifies that the input is a string and matches one of the
 * values defined in the `IntegrationType` enumeration.
 *
 * @param integrationType - The value to validate as an `IntegrationType`.
 * @returns A boolean indicating whether the input is a valid `IntegrationType`.
 */
export function isValidIntegrationType(integrationType: unknown): integrationType is IntegrationType {
  return (
    typeof integrationType === 'string' && Object.values(IntegrationType).includes(integrationType as IntegrationType)
  )
}
