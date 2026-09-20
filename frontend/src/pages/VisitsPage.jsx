import { useEffect, useState } from 'react'

import VisitForm from '../components/VisitForm.jsx'
import { createVisit, getVisits, updateVisit, deleteVisit } from '../services/visitsService.js'
import { getVeterinarians } from '../services/veterinariansService.js'
import { getAnimals } from '../services/animalsService.js'

/**
 * @typedef {Object} Visit
 * @property {number} id
 * @property {number} animal
 * @property {string} animal_name
 * @property {'dog' | 'cat' | 'other'} animal_species
 * @property {string} animal_owner_name
 * @property {number} veterinarian
 * @property {string} veterinarian_name
 * @property {string} visit_date
 * @property {string} reason
 * @property {string} notes
 * @property {'SCHEDULED' | 'COMPLETED' | 'CANCELLED'} status
 */

/**
 * @typedef {Object} Animal
 * @property {number} id
 * @property {string} name
 * @property {'dog' | 'cat' | 'other'} species
 * @property {string} owner_name
 */

/**
 * @typedef {Object} Veterinarian
 * @property {number} id
 * @property {string} first_name
 * @property {string} last_name
 */

const statusLabels = {
  SCHEDULED: 'Zaplanowana',
  COMPLETED: 'Zakończona',
  CANCELLED: 'Anulowana',
}

const speciesLabels = {
  dog: 'pies',
  cat: 'kot',
  other: 'inne',
}

/**
 * @param {string} value
 */
function formatVisitDate(value) {
  return new Intl.DateTimeFormat('pl-PL', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function VisitsPage() {
  const [visits, setVisits] = useState(
    /** @type {Visit[]} */ ([]),
  )
  const [animals, setAnimals] = useState(
  /** @type {Animal[]} */ ([]),
  )
  const [animalFilter, setAnimalFilter] = useState(
  /** @type {number | null} */ (null),
  )
  const [veterinarians, setVeterinarians] = useState(
  /** @type {Veterinarian[]} */ ([]),
  )
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [editingVisit, setEditingVisit] = useState(
  /** @type {Visit | null} */ (null),
  )
  const [formStatus, setFormStatus] = useState(
  /** @type {'idle' | 'saving' | 'error'} */ ('idle'),
)

  const [status, setStatus] = useState('loading')
  const [totalCount, setTotalCount] = useState(0)

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(
    /** @type {'' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'} */ (''),
    )
  const [page, setPage] = useState(1)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(false)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [search])

  /**
 * @param {{
 *   animal: number,
 *   veterinarian: number,
 *   visit_date: string,
 *   reason: string,
 *   notes: string,
 *   status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED',
 * }} visit
 */
async function handleCreateVisit(visit) {
  setFormStatus('saving')

  try {
    await createVisit(visit)

    const data = await getVisits({
      search: debouncedSearch,
      status: statusFilter,
      animal: animalFilter,
      page,
    })

    setVisits(data.results)
    setTotalCount(data.count)
    setHasPreviousPage(Boolean(data.previous))
    setHasNextPage(Boolean(data.next))
    setFormStatus('idle')
    setIsCreateFormOpen(false)
  } catch {
    setFormStatus('error')
  }
}

/**
 * @param {{
 *   animal: number,
 *   veterinarian: number,
 *   visit_date: string,
 *   reason: string,
 *   notes: string,
 *   status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED',
 * }} visit
 */
async function handleUpdateVisit(visit) {
  if (!editingVisit) {
    return
  }

  setFormStatus('saving')

  try {
    await updateVisit(editingVisit.id, visit)

    const data = await getVisits({
      search: debouncedSearch,
      status: statusFilter,
      animal: animalFilter,
      page,
    })

    setVisits(data.results)
    setTotalCount(data.count)
    setHasPreviousPage(Boolean(data.previous))
    setHasNextPage(Boolean(data.next))
    setFormStatus('idle')
    setEditingVisit(null)
  } catch {
    setFormStatus('error')
  }
}

/**
 * @param {Visit} visit
 */
async function handleDeleteVisit(visit) {
  const confirmed = window.confirm(
    `Czy na pewno chcesz usunąć wizytę pacjenta ${visit.animal_name}?`,
  )

  if (!confirmed) {
    return
  }

  try {
    await deleteVisit(visit.id)

    const data = await getVisits({
      search: debouncedSearch,
      status: statusFilter,
      animal: animalFilter,
      page,
    })

    setVisits(data.results)
    setTotalCount(data.count)
    setHasPreviousPage(Boolean(data.previous))
    setHasNextPage(Boolean(data.next))
  } catch {
    window.alert('Nie udało się usunąć wizyty.')
  }
}

  useEffect(() => {
    let isMounted = true

    async function loadAnimals() {
        try {
        const data = await getAnimals({
            pageSize: 100,
        })

        if (isMounted) {
            setAnimals(data.results)
        }
        } catch {
        // Lista wizyt nadal może działać bez filtra pacjenta.
        }
    }

    loadAnimals()

    return () => {
        isMounted = false
    }
    }, [])

  useEffect(() => {
    let isMounted = true

    async function loadVeterinarians() {
        try {
        const data = await getVeterinarians()

        if (isMounted) {
            setVeterinarians(data)
        }
        } catch {
        // Lista wizyt nadal może działać bez formularza tworzenia.
        }
    }

    loadVeterinarians()

    return () => {
        isMounted = false
    }
    }, [])

  useEffect(() => {
    let isMounted = true

    async function loadVisits() {
      try {
        const data = await getVisits({
            search: debouncedSearch,
            status: statusFilter,
            animal: animalFilter,
            page,
        })

        if (isMounted) {
          setVisits(data.results)
          setTotalCount(data.count)
          setHasPreviousPage(Boolean(data.previous))
          setHasNextPage(Boolean(data.next))
          setStatus('success')
        }
      } catch {
        if (isMounted) {
          setStatus('error')
        }
      }
    }

    loadVisits()

    return () => {
      isMounted = false
    }
  }, [debouncedSearch, statusFilter, page, animalFilter])

  if (status === 'loading') {
    return <p>Ładowanie wizyt...</p>
  }

  if (status === 'error') {
    return <p>Nie udało się pobrać wizyt.</p>
  }

  return (
    <div className="visits-page">
      <div className="page-heading">
        <div>
          <h1>Wizyty</h1>
          <p>
            Lista wizyt weterynaryjnych zarejestrowanych w klinice.
          </p>
        </div>

        <button
            type="button"
            className="primary-button"
            onClick={() => {
              setFormStatus('idle')
              setEditingVisit(null)
              setIsCreateFormOpen(true)
            }}
            >
            Dodaj wizytę
        </button>

        <div className="page-summary">
          <span>Łącznie</span>
          <strong>{totalCount}</strong>
        </div>
      </div>

      {isCreateFormOpen && (
        <VisitForm
            animals={animals}
            veterinarians={veterinarians}
            initialValues={null}
            status={formStatus}
            onSubmit={handleCreateVisit}
            onCancel={() => {
            setFormStatus('idle')
            setIsCreateFormOpen(false)
            }}
        />
      )}

      {editingVisit && (
        <VisitForm
          key={editingVisit.id}
          animals={animals}
          veterinarians={veterinarians}
          initialValues={{
          animal: editingVisit.animal,
          veterinarian: editingVisit.veterinarian,
          visit_date: editingVisit.visit_date,
          reason: editingVisit.reason,
          notes: editingVisit.notes,
          status: editingVisit.status,
        }}
          status={formStatus}
          onSubmit={handleUpdateVisit}
          onCancel={() => {
            setFormStatus('idle')
            setEditingVisit(null)
          }}
        />
      )}

      <div className="list-toolbar">
        <input
            type="search"
            value={search}
            onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
            }}
            placeholder="Szukaj po powodzie wizyty..."
            aria-label="Szukaj wizyt"
        />
        <select
            value={statusFilter}
            onChange={(event) => {
                setStatusFilter(
                    /** @type {'' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'} */ (
                    event.target.value
                    ),
                )
                setPage(1)
            }}
            aria-label="Filtruj po statusie"
        >
            <option value="">Wszystkie</option>
            <option value="SCHEDULED">Zaplanowane</option>
            <option value="COMPLETED">Zakończone</option>
            <option value="CANCELLED">Anulowane</option>
        </select>
        <select
            value={animalFilter ?? ''}
            onChange={(event) => {
                const value = event.target.value

                setAnimalFilter(value ? Number(value) : null)
                setPage(1)
            }}
            aria-label="Filtruj wizyty według pacjenta"
            >
            <option value="">Wszystkie zwierzęta</option>

            {animals.map((animal) => (
                <option key={animal.id} value={animal.id}>
                {animal.name} — {speciesLabels[animal.species]} — {animal.owner_name}
                </option>
            ))}
        </select>
      </div>

      {visits.length === 0 ? (
        <div className="empty-state">
          <h2>Brak wizyt</h2>
          <p>
            W klinice nie ma jeszcze zarejestrowanych wizyt.
          </p>
        </div>
      ) : (
        <>
            <div className="data-card">
            <div className="table-container">
                <table className="data-table">
                <thead>
                    <tr>
                    <th>Data</th>
                    <th>Zwierzę</th>
                    <th>Lekarz</th>
                    <th>Powód wizyty</th>
                    <th>Status</th>
                    <th>Akcje</th>
                    </tr>
                </thead>

                <tbody>
                    {visits.map((visit) => (
                    <tr key={visit.id}>
                      <td>{formatVisitDate(visit.visit_date)}</td>

                      <td>
                        <strong>{visit.animal_name}</strong>
                        <div className="table-secondary">
                          {speciesLabels[visit.animal_species]} · {visit.animal_owner_name}
                        </div>
                      </td>

                      <td>{visit.veterinarian_name || '—'}</td>

                      <td>{visit.reason}</td>

                      <td>
                        {statusLabels[visit.status] ?? visit.status}
                      </td>

                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="table-action-button"
                            onClick={() => {
                              setFormStatus('idle')
                              setIsCreateFormOpen(false)
                              setEditingVisit(visit)
                            }}
                          >
                            Edytuj
                          </button>
                          <button
                            type="button"
                            className="table-action-button"
                            onClick={() => {
                              handleDeleteVisit(visit)
                            }}
                          >
                            Usuń
                          </button>
                        </div>
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

export default VisitsPage