import { useEffect, useState } from 'react'

import { useAuth } from '../auth/useAuth.js'
import {
  createOwner,
  deleteOwner,
  getOwners,
  updateOwner,
} from '../services/ownersService.js'
import OwnerForm from '../components/OwnerForm.jsx'

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
  const [editingOwner, setEditingOwner] = useState(
  /** @type {Owner | null} */ (null),
  )
  const [formStatus, setFormStatus] = useState(
  /** @type {'idle' | 'saving' | 'error'} */ ('idle'),
  )
  const [deletingOwnerId, setDeletingOwnerId] = useState(
  /** @type {number | null} */ (null),
)
  const [status, setStatus] = useState('loading')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)

  /**
 * @param {{
 *   first_name: string,
 *   last_name: string,
 *   email: string,
 *   phone: string,
 *   address: string
 * }} owner
 */
async function handleCreateOwner(owner) {
  setFormStatus('saving')

  try {
    await createOwner(owner)

    const data = await getOwners({
      search: debouncedSearch,
      page,
    })

    setOwners(data.results)
    setTotalCount(data.count)
    setHasNextPage(Boolean(data.next))
    setHasPreviousPage(Boolean(data.previous))
    setFormStatus('idle')
    setIsCreateFormOpen(false)
  } catch {
    setFormStatus('error')
  }
}

/**
 * @param {{
 *   first_name: string,
 *   last_name: string,
 *   email: string,
 *   phone: string,
 *   address: string
 * }} owner
 */
async function handleUpdateOwner(owner) {
  if (!editingOwner) {
    return
  }

  setFormStatus('saving')

  try {
    await updateOwner(editingOwner.id, owner)

    const data = await getOwners({
      search: debouncedSearch,
      page,
    })

    setOwners(data.results)
    setTotalCount(data.count)
    setHasNextPage(Boolean(data.next))
    setHasPreviousPage(Boolean(data.previous))
    setFormStatus('idle')
    setEditingOwner(null)
  } catch {
    setFormStatus('error')
  }
}

/**
 * @param {Owner} owner
 */
async function handleDeleteOwner(owner) {
  const confirmed = window.confirm(
    `Czy na pewno chcesz usunąć właściciela ${owner.first_name} ${owner.last_name}?`,
  )

  if (!confirmed) {
    return
  }

  setDeletingOwnerId(owner.id)

  try {
    await deleteOwner(owner.id)

    if (owners.length === 1 && page > 1) {
      setPage((currentPage) => currentPage - 1)
      return
    }

    const data = await getOwners({
      search: debouncedSearch,
      page,
    })

    setOwners(data.results)
    setTotalCount(data.count)
    setHasNextPage(Boolean(data.next))
    setHasPreviousPage(Boolean(data.previous))
  } catch {
    window.alert('Nie udało się usunąć właściciela.')
  } finally {
    setDeletingOwnerId(null)
  }
}

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setPage(1)
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
        const data = await getOwners({
          search: debouncedSearch,
          page,
        })

        if (isMounted) {
          setOwners(data.results)
          setTotalCount(data.count)
          setHasNextPage(Boolean(data.next))
          setHasPreviousPage(Boolean(data.previous))
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
  }, [debouncedSearch, page])

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
            onClick={() => {
                setFormStatus('idle')
                setEditingOwner(null)
                setIsCreateFormOpen(true)
                }}
          >
            Dodaj właściciela
          </button>
        )}

        <div className="page-summary">
          <span>Łącznie</span>
          <strong>{totalCount}</strong>
        </div>
      </div>

      {editingOwner && (
        <OwnerForm
            key={editingOwner.id}
            title="Edytuj właściciela"
            description={`${editingOwner.first_name} ${editingOwner.last_name}`}
            initialValues={{
            first_name: editingOwner.first_name,
            last_name: editingOwner.last_name,
            email: editingOwner.email,
            phone: editingOwner.phone ?? '',
            address: editingOwner.address ?? '',
            }}
            status={formStatus}
            onSubmit={handleUpdateOwner}
            onCancel={() => {
            setFormStatus('idle')
            setEditingOwner(null)
            }}
        />
        )}

      {isCreateFormOpen && (
        <OwnerForm
            title="Nowy właściciel"
            description="Wprowadź dane właściciela zwierzęcia."
            status={formStatus}
            onSubmit={handleCreateOwner}
            onCancel={() => {
            setFormStatus('idle')
            setIsCreateFormOpen(false)
            }}
        />
        )}

      <div className="owners-toolbar">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={
            'Szukaj po imieniu, nazwisku, e-mailu lub telefonie...'
          }
          aria-label="Szukaj właścicieli"
        />
      </div>

      {owners.length === 0 ? (
        <div className="empty-state">
          <h2>Brak właścicieli</h2>
          <p>
            Brak właścicieli pasujących do podanych kryteriów.
          </p>
        </div>
      ) : (
        <>
          <div className="data-card">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Właściciel</th>
                    <th>E-mail</th>
                    <th>Telefon</th>
                    <th>Adres</th>
                    {canManageOwners && <th>Akcje</th>}
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
                      {canManageOwners && (
                        <td>
                            <div className="table-actions">
                                <button
                                type="button"
                                className="table-action-button"
                                onClick={() => {
                                    setFormStatus('idle')
                                    setIsCreateFormOpen(false)
                                    setEditingOwner(owner)
                                }}
                                >
                                Edytuj
                                </button>

                                <button
                                type="button"
                                className="table-action-button"
                                disabled={deletingOwnerId === owner.id}
                                onClick={() => handleDeleteOwner(owner)}
                                >
                                {deletingOwnerId === owner.id
                                    ? 'Usuwanie...'
                                    : 'Usuń'}
                                </button>
                            </div>
                            </td>
                        )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pagination">
            <button
              type="button"
              disabled={!hasPreviousPage}
              onClick={() =>
                setPage((currentPage) => currentPage - 1)
              }
            >
              Poprzednia
            </button>

            <span>Strona {page}</span>

            <button
              type="button"
              disabled={!hasNextPage}
              onClick={() =>
                setPage((currentPage) => currentPage + 1)
              }
            >
              Następna
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default OwnersPage