import { createContext } from 'react'

/**
 * @typedef {Object} AuthContextValue
 * @property {Object | null} user
 * @property {'loading' | 'authenticated' | 'unauthenticated'} status
 * @property {() => void} logout
 */

/** @type {import('react').Context<AuthContextValue | null>} */
const AuthContext = createContext(
  /** @type {AuthContextValue | null} */ (null),
)

export { AuthContext }