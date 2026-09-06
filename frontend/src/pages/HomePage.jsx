import { useEffect, useState } from 'react'

import { getCurrentUser } from '../services/authService.js'
import { getLiveness } from '../services/healthService.js'

function HomePage() {
  const [status, setStatus] = useState('checking')

  const [currentUser, setCurrentUser] = useState(
    /** @type {Awaited<ReturnType<typeof getCurrentUser>> | null} */ (null),
  )

  const [authStatus, setAuthStatus] = useState('checking')

  useEffect(() => {
    async function checkBackend() {
      try {
        await getLiveness()
        setStatus('online')
      } catch {
        setStatus('offline')
      }
    }

    async function checkCurrentUser() {
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
        setAuthStatus('authenticated')
      } catch {
        setAuthStatus('unauthenticated')
      }
    }

    checkBackend()
    checkCurrentUser()
  }, [])

  return (
    <>
      <h1>VetCRM</h1>
      <p>Veterinary Clinic Management System</p>

      <p>
        Backend status: <strong>{status}</strong>
      </p>

      <p>
        Authentication: <strong>{authStatus}</strong>
      </p>

      {currentUser && (
        <pre>{JSON.stringify(currentUser, null, 2)}</pre>
      )}
    </>
  )
}

export default HomePage