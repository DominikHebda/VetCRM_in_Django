import { createContext } from 'react'

/**
 * @typedef {Object} CurrentUser
 * @property {number} id
 * @property {string} username
 * @property {string} email
 * @property {string} role
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {CurrentUser | null} user
 * @property {'loading' | 'authenticated' | 'unauthenticated'} status
 * @property {() => void} logout
 */

/** @type {import('react').Context<AuthContextValue | null>} */
const AuthContext = createContext(
  /** @type {AuthContextValue | null} */ (null),
)

export { AuthContext }