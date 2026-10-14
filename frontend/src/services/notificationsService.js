import { apiRequest } from './apiClient.js'

/**
 * @typedef {Object} NotificationItem
 * @property {string} type
 * @property {string} severity
 * @property {string} message
 * @property {string} due_date
 * @property {number} animal_id
 * @property {number} [vaccination_id]
 * @property {number} [prescription_id]
 * @property {number} [visit_id]
 */

/**
 * @typedef {Object} NotificationList
 * @property {number} count
 * @property {NotificationItem[]} items
 */

/**
 * @returns {Promise<NotificationList>}
 */
async function getNotifications() {
  const data = await apiRequest('/api/notifications/')

  return /** @type {NotificationList} */ (data)
}

export { getNotifications }