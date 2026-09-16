import { apiRequest } from './apiClient.js'

/**
 * @typedef {Object} Animal
 * @property {number} id
 * @property {number} owner
 * @property {string} name
 * @property {'dog' | 'cat' | 'other'} species
 * @property {string | null} breed
 * @property {string | null} birth_date
 * @property {string | null} chip_number
 * @property {string | null} notes
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} AnimalsResponse
 * @property {number} count
 * @property {string | null} next
 * @property {string | null} previous
 * @property {Animal[]} results
 */

/**
 * Returns a paginated list of animals.
 *
 * @param {Object} [options]
 * @param {string} [options.search]
 * @param {number} [options.page]
 * @returns {Promise<AnimalsResponse>}
 */
async function getAnimals({
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
    ? `/api/animals/?${queryString}`
    : '/api/animals/'

  const data = await apiRequest(path)

  return /** @type {AnimalsResponse} */ (data)
}

export { getAnimals }