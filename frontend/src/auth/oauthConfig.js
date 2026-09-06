const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

const OAUTH_CLIENT_ID = import.meta.env.VITE_OAUTH_CLIENT_ID ?? ''

const OAUTH_REDIRECT_URI =
  import.meta.env.VITE_OAUTH_REDIRECT_URI ??
  'http://localhost:5173/auth/callback'

const OAUTH_AUTHORIZE_URL = `${API_BASE_URL}/o/authorize/`
const OAUTH_TOKEN_URL = `${API_BASE_URL}/o/token/`

export {
  OAUTH_AUTHORIZE_URL,
  OAUTH_CLIENT_ID,
  OAUTH_REDIRECT_URI,
  OAUTH_TOKEN_URL,
}