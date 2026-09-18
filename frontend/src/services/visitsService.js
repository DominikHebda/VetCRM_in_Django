import { apiRequest } from './apiClient.js'

/**
 * @typedef {Object} Visit
 * @property {number} id
 * @property {number} animal
 * @property {string} animal_name
 * @property {'dog' | 'cat' | 'other'} animal_species
 * @property {string} animal_owner_name
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
 * @param {string} [options.search]
 * @param {'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | ''} [options.status]
 * @param {number | null} [options.animal]
 * @param {number} [options.page]
 * @returns {Promise<VisitsResponse>}
 */

async function getVisits({
  search = '',
  status = '',
  animal = null,
  page = 1,
} = {}) {
  const params = new URLSearchParams()
  const query = search.trim()

    if (query) {
        params.set('search', query)
    }
    if (status) {
        params.set('status', status)
    }
    if (animal !== null) {
        params.set('animal', String(animal))
    }
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