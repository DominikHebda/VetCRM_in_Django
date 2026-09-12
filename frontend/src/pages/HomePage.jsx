import { useEffect, useState } from 'react'

import { useAuth } from '../auth/useAuth.js'
import { getLiveness } from '../services/healthService.js'

function HomePage() {
  const [status, setStatus] = useState('checking')
  const { user, status: authStatus, logout } = useAuth()
  useEffect(() => {
    async function checkBackend() {
      try {
        await getLiveness()
        setStatus('online')
      } catch {
        setStatus('offline')
      }
    }

    checkBackend()
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

      {authStatus === 'authenticated' && (
        <button type="button" onClick={logout}>
          Wyloguj
        </button>
      )}

      {user && <pre>{JSON.stringify(user, null, 2)}</pre>}
    </>
  )
}

export default HomePage