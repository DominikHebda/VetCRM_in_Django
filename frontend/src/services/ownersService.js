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
 * @param {Object} [options]
 * @param {string} [options.search]
 * @param {number} [options.page]
 * @returns {Promise<OwnersResponse>}
 */
async function getOwners({
  search = '',
  page = 1,
} = {}) {
  const params = new URLSearchParams()
  const query = search.trim()

  if (query) {
    params.set('search', query)
  }

  if (page > 1) {
    params.set('page', String(page))
  }

  const queryString = params.toString()
  const path = queryString
    ? `/api/owners/?${queryString}`
    : '/api/owners/'

  const data = await apiRequest(path)

  return /** @type {OwnersResponse} */ (data)
}

/**
 * @typedef {Object} OwnerPayload
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 * @property {string} phone
 * @property {string} address
 */

/**
 * Creates a new owner.
 *
 * @param {OwnerPayload} owner
 * @returns {Promise<Owner>}
 */
async function createOwner(owner) {
  const data = await apiRequest('/api/owners/', {
    method: 'POST',
    body: JSON.stringify(owner),
  })

  return /** @type {Owner} */ (data)
}

/**
 * Updates an existing owner.
 *
 * @param {number} ownerId
 * @param {OwnerPayload} owner
 * @returns {Promise<Owner>}
 */
async function updateOwner(ownerId, owner) {
  const data = await apiRequest(`/api/owners/${ownerId}/`, {
    method: 'PATCH',
    body: JSON.stringify(owner),
  })

  return /** @type {Owner} */ (data)
}

export { getOwners, createOwner, updateOwner }