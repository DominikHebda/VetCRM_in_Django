import { useEffect, useState } from 'react'

import { useAuth } from '../auth/useAuth.js'
import { createOwner, getOwners } from '../services/ownersService.js'
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
    const { user } = useAuth()

    const canManageOwners =
        user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST'
    const [owners, setOwners] = useState(
        /** @type {Owner[]} */ ([]),
    )
    const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
    const [createStatus, setCreateStatus] = useState('idle')
    const [status, setStatus] = useState('loading')
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    /**
     * @param {React.FormEvent<HTMLFormElement>} event
     */
    async function handleCreateOwner(event) {
        event.preventDefault()
        setCreateStatus('saving')

        const formData = new FormData(event.currentTarget)

        const owner = {
            first_name: String(formData.get('first_name') ?? '').trim(),
            last_name: String(formData.get('last_name') ?? '').trim(),
            email: String(formData.get('email') ?? '').trim(),
            phone: String(formData.get('phone') ?? '').trim(),
            address: String(formData.get('address') ?? '').trim(),
        }

        try {
            await createOwner(owner)
            setIsCreateFormOpen(false)

            const data = await getOwners(debouncedSearch)
            setOwners(data.results)
            setCreateStatus('idle')
            setIsCreateFormOpen(false)
        } catch {
            setCreateStatus('error')
        }
        }

    useEffect(() => {
    const timeoutId = window.setTimeout(() => {
        setDebouncedSearch(search)
    }, 300)

    return () => {
        window.clearTimeout(timeoutId)
    }
    }, [search])

  useEffect(() => {
  let isMounted = true

  async function loadOwners() {
    try {
      const data = await getOwners(debouncedSearch)

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
}, [debouncedSearch])

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
      {canManageOwners && (
        <button
            type="button"
            className="primary-button"
            onClick={() => setIsCreateFormOpen(true)}
        >
            Dodaj właściciela
        </button>
        )}

      <div className="page-summary">
        <span>Łącznie</span>
        <strong>{owners.length}</strong>
      </div>
    </div>
    {isCreateFormOpen && (
        <div className="owner-form-card">
            <div className="owner-form-heading">
            <div>
                <h2>Nowy właściciel</h2>
                <p>Wprowadź dane właściciela zwierzęcia.</p>
            </div>

            <button
                type="button"
                onClick={() => setIsCreateFormOpen(false)}
            >
                Anuluj
            </button>
            </div>

            <form
                className="owner-form"
                onSubmit={handleCreateOwner}
                >
            <label>
                Imię
                <input
                type="text"
                name="first_name"
                required
                />
            </label>

            <label>
                Nazwisko
                <input
                type="text"
                name="last_name"
                required
                />
            </label>

            <label>
                E-mail
                <input
                type="email"
                name="email"
                required
                />
            </label>

            <label>
                Telefon
                <input
                type="tel"
                name="phone"
                />
            </label>

            <label className="owner-form-full-width">
                Adres
                <textarea
                name="address"
                rows={3}
                />
            </label>

            {createStatus === 'error' && (
                <p className="form-error">
                    Nie udało się zapisać właściciela. Sprawdź dane i spróbuj ponownie.
                </p>
                )}

            <button
                type="submit"
                className="primary-button"
                disabled={createStatus === 'saving'}
                >
                {createStatus === 'saving'
                    ? 'Zapisywanie...'
                    : 'Zapisz właściciela'}
                </button>
            </form>
        </div>
        )}

    <div className="owners-toolbar">
    <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Szukaj po imieniu, nazwisku, e-mailu lub telefonie..."
        aria-label="Szukaj właścicieli"
    />
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