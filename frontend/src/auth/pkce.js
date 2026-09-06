/**
 * Converts bytes to a Base64 URL-safe string.
 *
 * @param {Uint8Array} bytes
 * @returns {string}
 */
function base64UrlEncode(bytes) {
  const binary = String.fromCharCode(...bytes)

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/**
 * Generates a cryptographically secure random string.
 *
 * @param {number} [length]
 * @returns {string}
 */
function generateRandomString(length = 64) {
  const charset =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'

  const randomValues = new Uint32Array(length)
  crypto.getRandomValues(randomValues)

  return Array.from(
    randomValues,
    (value) => charset[value % charset.length],
  ).join('')
}

/**
 * Creates a SHA-256 PKCE code challenge.
 *
 * @param {string} codeVerifier
 * @returns {Promise<string>}
 */
async function createCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier)
  const digest = await crypto.subtle.digest('SHA-256', data)

  return base64UrlEncode(new Uint8Array(digest))
}

/**
 * Creates a PKCE verifier and challenge pair.
 *
 * @returns {Promise<{codeVerifier: string, codeChallenge: string}>}
 */
async function createPkcePair() {
  const codeVerifier = generateRandomString(64)
  const codeChallenge = await createCodeChallenge(codeVerifier)

  return {
    codeVerifier,
    codeChallenge,
  }
}

/**
 * Creates a random OAuth state value.
 *
 * @returns {string}
 */
function createOAuthState() {
  return generateRandomString(32)
}

export { createOAuthState, createPkcePair }