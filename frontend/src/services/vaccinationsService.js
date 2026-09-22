import { apiRequest } from './apiClient.js'

/**
 * @typedef {Object} Vaccination
 * @property {number} id
 * @property {number} animal
 * @property {string} animal_name
 * @property {string} animal_owner_name
 * @property {number} veterinarian
 * @property {string} veterinarian_name
 * @property {string} vaccine_name
 * @property {string} manufacturer
 * @property {string} batch_number
 * @property {string} vaccination_date
 * @property {string | null} next_due_date
 * @property {string} notes
 * @property {string} created_at
 * @property {string} updated_at
 */

/**
 * @typedef {Object} VaccinationsResponse
 * @property {number} count
 * @property {string | null} next
 * @property {string | null} previous
 * @property {Vaccination[]} results
 */

/**
 * Fetches vaccinations.
 *
 * @param {Object} [filters]
 * @param {string} [filters.search]
 * @param {number | string} [filters.animal]
 * @param {number} [filters.page]
 * @returns {Promise<VaccinationsResponse>}
 */
async function getVaccinations({
  search = '',
  animal = '',
  page = 1,
} = {}) {
  const params = new URLSearchParams()

  if (search.trim()) {
    params.set('search', search.trim())
  }

  if (animal) {
    params.set('animal', String(animal))
  }

  if (page > 1) {
    params.set('page', String(page))
  }

  const query = params.toString()
  const path = query
    ? `/api/vaccinations/?${query}`
    : '/api/vaccinations/'

  const data = await apiRequest(path)

  return /** @type {VaccinationsResponse} */ (data)
}

/**
 * Creates a new vaccination.
 *
 * @param {{
 *   animal: number,
 *   veterinarian: number,
 *   vaccine_name: string,
 *   manufacturer: string,
 *   batch_number: string,
 *   vaccination_date: string,
 *   next_due_date: string | null,
 *   notes: string,
 * }} vaccination
 * @returns {Promise<Vaccination>}
 */
async function createVaccination(vaccination) {
  const data = await apiRequest('/api/vaccinations/', {
    method: 'POST',
    body: JSON.stringify(vaccination),
  })

  return /** @type {Vaccination} */ (data)
}

/**
 * Updates an existing vaccination.
 *
 * @param {number} vaccinationId
 * @param {{
 *   animal: number,
 *   veterinarian: number,
 *   vaccine_name: string,
 *   manufacturer: string,
 *   batch_number: string,
 *   vaccination_date: string,
 *   next_due_date: string | null,
 *   notes: string,
 * }} vaccination
 * @returns {Promise<Vaccination>}
 */
async function updateVaccination(vaccinationId, vaccination) {
  const data = await apiRequest(`/api/vaccinations/${vaccinationId}/`, {
    method: 'PATCH',
    body: JSON.stringify(vaccination),
  })

  return /** @type {Vaccination} */ (data)
}

export { getVaccinations, createVaccination, updateVaccination }