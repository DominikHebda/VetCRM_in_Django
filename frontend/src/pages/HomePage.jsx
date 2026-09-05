import { useEffect, useState } from 'react'

import { getLiveness } from '../services/healthService.js'

function HomePage() {
  const [status, setStatus] = useState('checking')

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
    </>
  )
}

export default HomePage