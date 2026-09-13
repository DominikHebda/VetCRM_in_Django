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
        <p>
          Lista właścicieli zwierząt zarejestrowanych w klinice.
        </p>
      </div>

      <div className="page-summary">
        <span>Łącznie</span>
        <strong>{owners.length}</strong>
      </div>
    </div>

    {owners.length === 0 ? (
      <div className="empty-state">
        <h2>Brak właścicieli</h2>
        <p>
          W bazie nie ma jeszcze żadnych właścicieli.
        </p>
      </div>
    ) : (
      <div className="data-card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Właściciel</th>
                <th>E-mail</th>
                <th>Telefon</th>
                <th>Adres</th>
              </tr>
            </thead>

            <tbody>
              {owners.map((owner) => (
                <tr key={owner.id}>
                  <td>
                    <div className="owner-name">
                      <div className="owner-avatar">
                        {owner.first_name.charAt(0)}
                        {owner.last_name.charAt(0)}
                      </div>

                      <div>
                        <strong>
                          {owner.first_name} {owner.last_name}
                        </strong>
                        <span>ID: {owner.id}</span>
                      </div>
                    </div>
                  </td>

                  <td>{owner.email}</td>
                  <td>{owner.phone || '—'}</td>
                  <td>{owner.address || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )}
  </div>
)
}

export default OwnersPage