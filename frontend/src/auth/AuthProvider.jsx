import { useEffect, useState } from 'react'

import { getCurrentUser } from '../services/authService.js'
import { AuthContext } from './authContext.js'
import {
  clearOAuthTokens,
  getAccessToken,
  getRefreshToken,
} from './oauth.js'
import { LOGOUT_URL } from './oauthConfig.js'

/**
 * @typedef {Object} CurrentUser
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} role
 */

/**
 * @param {{ children: import('react').ReactNode }} props
 */
function AuthProvider({ children }) {
  const [user, setUser] = useState(
    /** @type {CurrentUser | null} */ (null),
  )

  const [status, setStatus] = useState(
  /** @returns {'loading' | 'authenticated' | 'unauthenticated'} */
  () =>
    getAccessToken() || getRefreshToken()
      ? 'loading'
      : 'unauthenticated',
)

  useEffect(() => {
    if (!getAccessToken() && !getRefreshToken()) {
      return
    }

    let isActive = true

    async function loadCurrentUser() {
      try {
        const currentUser = await getCurrentUser()

        if (isActive) {
          setUser(currentUser)
          setStatus('authenticated')
        }
      } catch {
        if (isActive) {
          setUser(null)
          setStatus('unauthenticated')
        }
      }
    }

    loadCurrentUser()

    return () => {
      isActive = false
    }
  }, [])

  function logout() {
    clearOAuthTokens()
    setUser(null)
    setStatus('unauthenticated')
    window.location.assign(LOGOUT_URL)
  }

  const value = {
    user,
    status,
    logout,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider