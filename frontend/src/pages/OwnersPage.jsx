import { useEffect, useState } from 'react'

import { getOwners } from '../services/ownersService.js'

/**
 * @typedef {Object} Owner
 * @property {number} id
 * @property {string} first_name
 * @property {string} last_name
 * @property {string} email
 * @property {string | null} phone
 * @property {string | null} address
 */

function OwnersPage() {
  const [owners, setOwners] = useState(
    /** @type {Owner[]} */ ([]),
  )
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let isMounted = true

    async function loadOwners() {
      try {
        const data = await getOwners()

        if (isMounted) {
        setOwners(data.results)
        setStatus('success')
        }
      } catch {
        if (isMounted) {
          setStatus('error')
        }
      }
    }

    loadOwners()

    return () => {
      isMounted = false
    }
  }, [])

  if (status === 'loading') {
    return <p>Ładowanie właścicieli...</p>
  }

  if (status === 'error') {
    return <p>Nie udało się pobrać właścicieli.</p>
  }

  return (
    <div className="owners-page">
      <div className="page-heading">
        <div>
          <h1>Właściciele</h1>
          <p>Lista właścicieli zwierząt zarejestrowanych w klinice.</p>
        </div>
      </div>

      {owners.length === 0 ? (
        <p>Brak właścicieli.</p>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Imię i nazwisko</th>
                <th>E-mail</th>
                <th>Telefon</th>
                <th>Adres</th>
              </tr>
            </thead>

            <tbody>
              {owners.map((owner) => (
                <tr key={owner.id}>
                  <td>
                    <strong>
                      {owner.first_name} {owner.last_name}
                    </strong>
                  </td>
                  <td>{owner.email}</td>
                  <td>{owner.phone || '—'}</td>
                  <td>{owner.address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default OwnersPage