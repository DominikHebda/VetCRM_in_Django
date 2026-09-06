import { useEffect, useRef, useState } from 'react'

import { exchangeAuthorizationCode } from '../auth/oauth.js'

function AuthCallbackPage() {
  const exchangeStarted = useRef(false)
  const [status, setStatus] = useState('Trwa logowanie...')

  useEffect(() => {
    if (exchangeStarted.current) {
      return
    }

    exchangeStarted.current = true

    async function finishLogin() {
      try {
        const params = new URLSearchParams(window.location.search)
        const code = params.get('code')
        const state = params.get('state')
        const error = params.get('error')

        if (error) {
          throw new Error(`Błąd OAuth: ${error}`)
        }

        if (!code || !state) {
          throw new Error(
            'Brak kodu autoryzacyjnego lub parametru state.',
          )
        }

        await exchangeAuthorizationCode(code, state)

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        )

        setStatus('Logowanie zakończone pomyślnie.')
      } catch (callbackError) {
        setStatus(
          callbackError instanceof Error
            ? callbackError.message
            : 'Nie udało się zakończyć logowania.',
        )
      }
    }

    finishLogin()
  }, [])

  return (
    <main>
      <h1>OAuth callback</h1>
      <p>{status}</p>
    </main>
  )
}

export default AuthCallbackPage