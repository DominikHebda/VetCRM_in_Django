import { apiRequest } from './apiClient.js'

/**
 * @typedef {Object} MedicalRecord
 * @property {number} id
 * @property {number} visit
 * @property {string} animal_name
 * @property {'dog' | 'cat' | 'other'} animal_species
 * @property {string} animal_owner_name
 * @property {string} diagnosis
 * @property {string} treatment
 * @property {string} recommendations
 * @property {string | null} weight
 * @property {string | null} temperature
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} MedicalRecordsResponse
 * @property {number} count
 * @property {string | null} next
 * @property {string | null} previous
 * @property {MedicalRecord[]} results
 */

/**
 * Fetches medical records.
 *
 * @param {Object} [options]
 * @param {string} [options.search]
 * @param {number | null} [options.animal]
 * @param {number} [options.page]
 * @returns {Promise<MedicalRecordsResponse>}
 */
async function getMedicalRecords({
  search = '',
  animal = null,
  page = 1,
} = {}) {
  const params = new URLSearchParams()

  if (search) {
    params.set('search', search)
  }

  if (animal) {
    params.set('visit__animal', String(animal))
  }

  params.set('page', String(page))

  const query = params.toString()
  const data = await apiRequest(`/api/medical-records/?${query}`)

  return /** @type {MedicalRecordsResponse} */ (data)
}

export { getMedicalRecords }