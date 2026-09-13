import { apiRequest } from './apiClient.js'

/**
 * @typedef {Object} RecentVisit
 * @property {number} id
 * @property {string} visit_date
 * @property {string} reason
 * @property {string} status
 * @property {string} animal__name
 */

/**
 * @typedef {Object} RecentAnimal
 * @property {number} id
 * @property {string} name
 * @property {string} species
 * @property {string} owner__last_name
 */

/**
 * @typedef {Object} DashboardSummary
 * @property {number} owners_count
 * @property {number} animals_count
 * @property {number} today_visits
 * @property {number} scheduled_visits
 * @property {number} vaccinations_due
 * @property {number} prescriptions_expiring
 * @property {RecentVisit[]} recent_visits
 * @property {RecentAnimal[]} recent_animals
 */

/**
 * Returns dashboard summary for the current user.
 *
 * @returns {Promise<DashboardSummary>}
 */
async function getDashboardSummary() {
  const data = await apiRequest('/api/dashboard/')

  return /** @type {DashboardSummary} */ (data)
}

export { getDashboardSummary }