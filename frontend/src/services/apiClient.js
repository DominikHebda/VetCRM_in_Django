import {
  getAccessToken,
  getRefreshToken,
  refreshAccessToken,
} from '../auth/oauth.js'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

/**
 * Sends a single request to the VetCRM REST API.
 *
 * @param {string} path
 * @param {RequestInit} options
 * @returns {Promise<Response>}
 */
async function sendRequest(path, options) {
  const token = getAccessToken()
  const headers = new Headers(options.headers)

  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })
}

/**
 * Sends a request to the VetCRM REST API.
 *
 * If the access token has expired, the request is retried once
 * after refreshing the token.
 *
 * @param {string} path
 * @param {RequestInit} [options]
 * @param {boolean} [retryAfterRefresh]
 * @returns {Promise<unknown>}
 */
async function apiRequest(
  path,
  options = {},
  retryAfterRefresh = true,
) {
  let response = await sendRequest(path, options)

  if (
    response.status === 401 &&
    retryAfterRefresh &&
    getRefreshToken()
  ) {
    await refreshAccessToken()
    response = await sendRequest(path, options)
  }

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export { API_BASE_URL, apiRequest }