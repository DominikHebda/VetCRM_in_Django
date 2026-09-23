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

/**
 * @param {{
 *   animal: number,
 *   visit: number,
 *   medication_name: string,
 *   active_substance: string,
 *   dosage: string,
 *   frequency: string,
 *   duration: string,
 *   quantity: number,
 *   issue_date: string,
 *   valid_until: string,
 *   instructions: string,
 * }} prescription
 * @returns {Promise<Prescription>}
 */
async function createPrescription(prescription) {
  const data = /** @type {Prescription} */ (
    await apiRequest('/api/prescriptions/', {
      method: 'POST',
      body: JSON.stringify(prescription),
    })
  )

  return data
}

/**
 * @param {number} prescriptionId
 * @param {{
 *   animal: number,
 *   visit: number,
 *   medication_name: string,
 *   active_substance: string,
 *   dosage: string,
 *   frequency: string,
 *   duration: string,
 *   quantity: number,
 *   issue_date: string,
 *   valid_until: string,
 *   instructions: string,
 * }} prescription
 * @returns {Promise<Prescription>}
 */
async function updatePrescription(prescriptionId, prescription) {
  const data = /** @type {Prescription} */ (
    await apiRequest(`/api/prescriptions/${prescriptionId}/`, {
      method: 'PATCH',
      body: JSON.stringify(prescription),
    })
  )

  return data
}

export { getPrescriptions, createPrescription, updatePrescription }