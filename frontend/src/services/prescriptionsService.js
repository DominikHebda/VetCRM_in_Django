import { apiRequest } from './apiClient.js'

/**
 * @typedef {Object} Prescription
 * @property {number} id
 * @property {number} animal
 * @property {string} animal_name
 * @property {string} animal_owner_name
 * @property {number} visit
 * @property {number} veterinarian
 * @property {string} veterinarian_name
 * @property {string} prescription_number
 * @property {string} medication_name
 * @property {string} active_substance
 * @property {string} dosage
 * @property {string} frequency
 * @property {string} duration
 * @property {number} quantity
 * @property {string} issue_date
 * @property {string} valid_until
 * @property {string} instructions
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @param {{
 *   search?: string,
 *   animal?: number | string,
 *   page?: number
 * }} [params]
 * @returns {Promise<{
 *   count: number,
 *   next: string | null,
 *   previous: string | null,
 *   results: Prescription[]
 * }>}
 */
async function getPrescriptions({
  search = '',
  animal = '',
  page = 1,
} = {}) {
  const query = new URLSearchParams()

  if (search) {
    query.set('search', search)
  }

  if (animal) {
    query.set('animal', String(animal))
  }

  if (page) {
    query.set('page', String(page))
  }

  const suffix = query.toString() ? `?${query.toString()}` : ''

  const data = /** @type {{
  count: number,
  next: string | null,
  previous: string | null,
  results: Prescription[]
}} */ (await apiRequest(`/api/prescriptions/${suffix}`))

return data
}

export { getPrescriptions }