import { useEffect, useState } from 'react'

import AnimalForm from '../components/AnimalForm.jsx'
import { useAuth } from '../auth/useAuth.js'
import {
  createAnimal,
  getAnimals,
} from '../services/animalsService.js'
import { getOwners } from '../services/ownersService.js'

/**
 * @typedef {Object} Animal
 * @property {number} id
 * @property {number} owner
 * @property {string} name
 * @property {'dog' | 'cat' | 'other'} species
 * @property {string | null} breed
 * @property {string | null} birth_date
 * @property {string | null} chip_number
 */

/**
 * @typedef {Object} Owner
 * @property {number} id
 * @property {string} first_name
 * @property {string} last_name
 */

const speciesLabels = {
  dog: 'Pies',
  cat: 'Kot',
  other: 'Inny',
}

function AnimalsPage() {
  const { user } = useAuth()

  const canManageAnimals =
    user?.role === 'ADMIN' || user?.role === 'RECEPTIONIST'

  const [animals, setAnimals] = useState(
    /** @type {Animal[]} */ ([]),
  )
  const [owners, setOwners] = useState(
  /** @type {Owner[]} */ ([]),
)
  const [status, setStatus] = useState('loading')
  const [totalCount, setTotalCount] = useState(0)

  const [page, setPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [formStatus, setFormStatus] = useState(
    /** @type {'idle' | 'saving' | 'error'} */ ('idle'),
  )

    /**
   * @param {{
   *   owner: number,
   *   name: string,
   *   species: 'dog' | 'cat' | 'other',
   *   breed: string,
   *   birth_date: string | null,
   *   chip_number: string,
   *   notes: string,
   * }} animal
   */
  async function handleCreateAnimal(animal) {
    setFormStatus('saving')

    try {
      await createAnimal(animal)

      const data = await getAnimals({
        search: debouncedSearch,
        page,
      })

      setAnimals(data.results)
      setTotalCount(data.count)
      setHasNextPage(Boolean(data.next))
      setHasPreviousPage(Boolean(data.previous))
      setFormStatus('idle')
      setIsCreateFormOpen(false)
    } catch {
      setFormStatus('error')
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

    async function loadAnimals() {
      try {
        const [animalsData, ownersData] = await Promise.all([
        getAnimals({ search: debouncedSearch, page }),
        getOwners({ pageSize: 100 }),
        ])

        if (isMounted) {
        setAnimals(animalsData.results)
        setOwners(ownersData.results)
        setTotalCount(animalsData.count)
        setHasNextPage(Boolean(animalsData.next))
        setHasPreviousPage(Boolean(animalsData.previous))
        setStatus('success')
        }
      } catch {
        if (isMounted) {
          setStatus('error')
        }
      }
    }

    loadAnimals()

    return () => {
      isMounted = false
    }
  }, [debouncedSearch, page])

  if (status === 'loading') {
    return <p>Ładowanie zwierząt...</p>
  }

  if (status === 'error') {
    return <p>Nie udało się pobrać zwierząt.</p>
  }

  const ownersById = new Map(
    owners.map((owner) => [
        owner.id,
        `${owner.first_name} ${owner.last_name}`,
    ]),
  )

  return (
    <div className="animals-page">
        <div className="page-heading">
            <div>
            <h1>Zwierzęta</h1>
            <p>
                Lista pacjentów zarejestrowanych w klinice.
            </p>
            </div>

            {canManageAnimals && (
            <button
                type="button"
                className="primary-button"
                onClick={() => {
                setFormStatus('idle')
                setIsCreateFormOpen(true)
                }}
            >
                Dodaj zwierzę
            </button>
            )}

            <div className="page-summary">
            <span>Łącznie</span>
            <strong>{totalCount}</strong>
            </div>
        </div>

        {canManageAnimals && isCreateFormOpen && (
            <AnimalForm
            owners={owners}
            status={formStatus}
            onSubmit={handleCreateAnimal}
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
                placeholder="Szukaj po nazwie, rasie lub numerze chipa..."
                aria-label="Szukaj zwierząt"
            />
        </div>

      {animals.length === 0 ? (
        <div className="empty-state">
          <h2>Brak zwierząt</h2>
          <p>
            W klinice nie ma jeszcze zarejestrowanych zwierząt.
          </p>
        </div>
      ) : (
        <>
        <div className="data-card">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Zwierzę</th>
                  <th>Gatunek</th>
                  <th>Rasa</th>
                  <th>Data urodzenia</th>
                  <th>Numer chipa</th>
                  <th>Właściciel</th>
                </tr>
              </thead>

              <tbody>
                {animals.map((animal) => (
                  <tr key={animal.id}>
                    <td>
                      <strong>{animal.name}</strong>
                    </td>
                    <td>
                      {speciesLabels[animal.species] ?? animal.species}
                    </td>
                    <td>{animal.breed || '—'}</td>
                    <td>{animal.birth_date || '—'}</td>
                    <td>{animal.chip_number || '—'}</td>
                    <td>
                        {ownersById.get(animal.owner) ?? `ID: ${animal.owner}`}
                    </td>
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

export default AnimalsPage