import { apiRequest } from './apiClient.js'

/**
 * @typedef {Object} CurrentUser
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} role
 */

/**
 * Returns the currently authenticated user.
 *
 * @returns {Promise<CurrentUser>}
 */
async function getCurrentUser() {
  const user = await apiRequest('/api/auth/me/')

  const currentUser = /** @type {CurrentUser} */ (user)

  return currentUser
}

export { getCurrentUser }