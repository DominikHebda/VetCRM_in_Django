import { apiRequest } from './apiClient.js'

/**
 * @typedef {Object} Visit
 * @property {number} id
 * @property {number} animal
 * @property {string} animal_name
 * @property {number} veterinarian
 * @property {string} veterinarian_name
 * @property {string} visit_date
 * @property {string} reason
 * @property {string} notes
 * @property {'SCHEDULED' | 'COMPLETED' | 'CANCELLED'} status
 * @property {string} created_at
 */

/**
 * @typedef {Object} VisitsResponse
 * @property {number} count
 * @property {string | null} next
 * @property {string | null} previous
 * @property {Visit[]} results
 */

/**
 * Returns a paginated list of visits.
 *
 * @param {Object} [options]
 * @param {number} [options.page]
 * @returns {Promise<VisitsResponse>}
 */
async function getVisits({
  page = 1,
} = {}) {
  const params = new URLSearchParams()

  if (page > 1) {
    params.set('page', String(page))
  }

  const queryString = params.toString()
  const path = queryString
    ? `/api/visits/?${queryString}`
    : '/api/visits/'

  const data = await apiRequest(path)

  return /** @type {VisitsResponse} */ (data)
}

export { getVisits }