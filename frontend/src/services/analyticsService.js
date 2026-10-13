import { apiRequest } from './apiClient.js'

/**
 * @typedef {Object} AnalyticsOverview
 * @property {Array<{month: string, count: number}>} visits_by_month
 * @property {Array<{species: string, count: number}>} animals_by_species
 * @property {Array<{vaccine_name: string, count: number}>} top_vaccines
 * @property {Array<{medication_name: string, count: number}>} top_medications
 * @property {Array<{
 *   veterinarian_id: number,
 *   veterinarian__first_name: string,
 *   veterinarian__last_name: string,
 *   count: number
 * }>} visits_by_veterinarian
 */

/**
 * @returns {Promise<AnalyticsOverview>}
 */
async function getAnalyticsOverview() {
  const data = await apiRequest('/api/analytics/overview/')

  return /** @type {AnalyticsOverview} */ (data)
}

export { getAnalyticsOverview }