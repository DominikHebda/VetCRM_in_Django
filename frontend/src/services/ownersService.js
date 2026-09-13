import { apiRequest } from './apiClient.js'

/**
 * @typedef {Object} Owner
 * @property {number} id
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 * @property {string | null} phone
 * @property {string | null} address
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} OwnersResponse
 * @property {number} count
 * @property {string | null} next
 * @property {string | null} previous
 * @property {Owner[]} results
 */

/**
 * Returns a paginated list of owners.
 *
 * @returns {Promise<OwnersResponse>}
 */
async function getOwners() {
  const data = await apiRequest('/api/owners/')

  return /** @type {OwnersResponse} */ (data)
}

export { getOwners }