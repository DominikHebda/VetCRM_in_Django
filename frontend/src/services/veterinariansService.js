import { apiRequest } from './apiClient.js'

/**
 * @typedef {Object} Veterinarian
 * @property {number} id
 * @property {string} first_name
 * @property {string} last_name
 */

/**
 * Returns veterinarians available for visits.
 *
 * @returns {Promise<Veterinarian[]>}
 */
async function getVeterinarians() {
  const data = await apiRequest('/api/veterinarians/')

  return /** @type {Veterinarian[]} */ (data)
}

export { getVeterinarians }