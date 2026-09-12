import { useEffect, useState } from 'react'

import { getCurrentUser } from '../services/authService.js'
import { AuthContext } from './authContext.js'
import { clearOAuthTokens } from './oauth.js'

/**
 * @typedef {Awaited<ReturnType<typeof getCurrentUser>>} CurrentUser
 */

/**
 * @param {{ children: import('react').ReactNode }} props
 */
function AuthProvider({ children }) {
  const [user, setUser] = useState(
    /** @type {CurrentUser | null} */ (null),
  )

  const [status, setStatus] = useState(
    /** @type {'loading' | 'authenticated' | 'unauthenticated'} */ (
      'loading'
    ),
  )

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const currentUser = await getCurrentUser()

        setUser(currentUser)
        setStatus('authenticated')
      } catch {
        setUser(null)
        setStatus('unauthenticated')
      }
    }

    loadCurrentUser()
  }, [])

  function logout() {
  clearOAuthTokens()
  setUser(null)
  setStatus('unauthenticated')
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