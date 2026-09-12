import {
  OAUTH_AUTHORIZE_URL,
  OAUTH_CLIENT_ID,
  OAUTH_REDIRECT_URI,
  OAUTH_TOKEN_URL,
} from './oauthConfig.js'
import { createOAuthState, createPkcePair } from './pkce.js'

const PKCE_VERIFIER_KEY = 'vetcrm_pkce_verifier'
const OAUTH_STATE_KEY = 'vetcrm_oauth_state'
const ACCESS_TOKEN_KEY = 'vetcrm_access_token'
const REFRESH_TOKEN_KEY = 'vetcrm_refresh_token'
/** @type {Promise<string> | null} */
let refreshPromise = null

async function loginWithOAuth() {
  if (!OAUTH_CLIENT_ID) {
    throw new Error('VITE_OAUTH_CLIENT_ID is not configured')
  }

  const { codeVerifier, codeChallenge } = await createPkcePair()
  const state = createOAuthState()

  sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier)
  sessionStorage.setItem(OAUTH_STATE_KEY, state)

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT_URI,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
  })

  window.location.assign(`${OAUTH_AUTHORIZE_URL}?${params.toString()}`)
}

/**
 * Exchanges an OAuth authorization code for tokens.
 *
 * @param {string} code
 * @param {string} state
 * @returns {Promise<object>}
 */
async function exchangeAuthorizationCode(code, state) {
  const expectedState = sessionStorage.getItem(OAUTH_STATE_KEY)
  const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY)

  if (!expectedState || state !== expectedState) {
    throw new Error('Invalid OAuth state')
  }

  if (!codeVerifier) {
    throw new Error('PKCE code verifier is missing')
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT_URI,
    code_verifier: codeVerifier,
  })

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error_description ?? data.error ?? 'OAuth token exchange failed')
  }

  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access_token)

  if (data.refresh_token) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
  }

  sessionStorage.removeItem(PKCE_VERIFIER_KEY)
  sessionStorage.removeItem(OAUTH_STATE_KEY)

  return data
}

function getAccessToken() {
  return sessionStorage.getItem(ACCESS_TOKEN_KEY)
}

function getRefreshToken() {
  return sessionStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * Uses the refresh token to obtain a new access token.
 *
 * @returns {Promise<string>}
 */
async function performTokenRefresh() {
  const refreshToken = getRefreshToken()

  if (!refreshToken) {
    throw new Error('OAuth refresh token is missing')
  }

  if (!OAUTH_CLIENT_ID) {
    throw new Error('VITE_OAUTH_CLIENT_ID is not configured')
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: OAUTH_CLIENT_ID,
  })

  const response = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const data = await response.json()

  if (!response.ok) {
    clearOAuthTokens()

    throw new Error(
      data.error_description ??
        data.error ??
        'OAuth token refresh failed',
    )
  }

  sessionStorage.setItem(ACCESS_TOKEN_KEY, data.access_token)

  if (data.refresh_token) {
    sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token)
  }

  return data.access_token
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = performTokenRefresh().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

function clearOAuthTokens() {
  sessionStorage.removeItem(ACCESS_TOKEN_KEY)
  sessionStorage.removeItem(REFRESH_TOKEN_KEY)
  sessionStorage.removeItem(PKCE_VERIFIER_KEY)
  sessionStorage.removeItem(OAUTH_STATE_KEY)
}

export {
  ACCESS_TOKEN_KEY,
  OAUTH_STATE_KEY,
  PKCE_VERIFIER_KEY,
  REFRESH_TOKEN_KEY,
  clearOAuthTokens,
  exchangeAuthorizationCode,
  getAccessToken,
  getRefreshToken,
  loginWithOAuth,
  refreshAccessToken,
}