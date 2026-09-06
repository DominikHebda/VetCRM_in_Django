import { useState } from 'react'

import { loginWithOAuth } from '../auth/oauth.js'

function LoginPage() {
  const [error, setError] = useState('')

  async function handleLogin() {
    setError('')

    try {
      await loginWithOAuth()
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : 'Nie udało się rozpocząć logowania.',
      )
    }
  }

  return (
    <main>
      <h1>Logowanie</h1>

      <button type="button" onClick={handleLogin}>
        Zaloguj przez OAuth 2.0
      </button>

      {error && <p>{error}</p>}
    </main>
  )
}

export default LoginPage