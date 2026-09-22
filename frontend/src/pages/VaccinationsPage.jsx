import { useEffect, useState } from 'react'
import VaccinationForm from '../components/VaccinationForm.jsx'
import { useAuth } from '../auth/useAuth.js'
import { getVeterinarians } from '../services/veterinariansService.js'

import { createVaccination,
         getVaccinations,
         updateVaccination,
} from '../services/vaccinationsService.js'
import { getAnimals } from '../services/animalsService.js'

function VaccinationsPage() {
  const { user } = useAuth()

  const canManageVaccinations =
    user?.role === 'ADMIN' || user?.role === 'VET'
  const [vaccinations, setVaccinations] = useState(
    /** @type {import('../services/vaccinationsService.js').Vaccination[]} */ ([]),
  )
  const [totalCount, setTotalCount] = useState(0)
  const [status, setStatus] = useState('loading')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [animals, setAnimals] = useState(
    /** @type {Awaited<ReturnType<typeof getAnimals>>['results']} */ ([]),
  )
  const [animalFilter, setAnimalFilter] = useState(
    /** @type {number | null} */ (null),
  )
  const [page, setPage] = useState(1)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [veterinarians, setVeterinarians] = useState(
    /** @type {Awaited<ReturnType<typeof getVeterinarians>>} */ ([]),
  )
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [editingVaccination, setEditingVaccination] = useState(
    /** @type {import('../services/vaccinationsService.js').Vaccination | null} */ (null),
  )
  const [formStatus, setFormStatus] = useState(
    /** @type {'idle' | 'saving' | 'error'} */ ('idle'),
  )

    /**
   * @param {{
   *   animal: number,
   *   veterinarian: number,
   *   vaccine_name: string,
   *   manufacturer: string,
   *   batch_number: string,
   *   vaccination_date: string,
   *   next_due_date: string | null,
   *   notes: string,
   * }} values
   */
  async function handleCreateVaccination(values) {
    setFormStatus('saving')

    try {
      await createVaccination(values)

      setIsCreateFormOpen(false)
      setFormStatus('idle')
      setPage(1)

      const data = await getVaccinations({
        search: debouncedSearch,
        animal: animalFilter || undefined,
        page: 1,
      })

      setVaccinations(data.results)
      setTotalCount(data.count)
      setHasPreviousPage(Boolean(data.previous))
      setHasNextPage(Boolean(data.next))
    } catch {
      setFormStatus('error')
    }
  }

  /**
 * @param {{
 *   animal: number,
 *   veterinarian: number,
 *   vaccine_name: string,
 *   manufacturer: string,
 *   batch_number: string,
 *   vaccination_date: string,
 *   next_due_date: string | null,
 *   notes: string,
 * }} values
 */
    async function handleUpdateVaccination(values) {
      if (!editingVaccination) {
        return
      }

      setFormStatus('saving')

      try {
        await updateVaccination(editingVaccination.id, values)

        const data = await getVaccinations({
        search: debouncedSearch,
        animal: animalFilter || undefined,
        page,
      })

      setVaccinations(data.results)
      setTotalCount(data.count)
      setHasPreviousPage(Boolean(data.previous))
      setHasNextPage(Boolean(data.next))

      setFormStatus('idle')
      setEditingVaccination(null)
    } catch {
        setFormStatus('error')
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [search])

  useEffect(() => {
    let isActive = true

    async function loadAnimals() {
      try {
        const data = await getAnimals({ pageSize: 100 })

        if (isActive) {
          setAnimals(data.results)
        }
      } catch {
        if (isActive) {
          setAnimals([])
        }
      }
    }

    loadAnimals()

    return () => {
      isActive = false
   }
}, [])

  useEffect(() => {
    if (!canManageVaccinations) {
      return undefined
    }

    let isActive = true

    async function loadVeterinarians() {
      try {
        const data = await getVeterinarians()

        if (isActive) {
          setVeterinarians(data)
        }
      } catch {
        if (isActive) {
          setVeterinarians([])
        }
      }
    }

    loadVeterinarians()

    return () => {
      isActive = false
    }
  }, [canManageVaccinations])

  useEffect(() => {
    let isActive = true

    async function loadVaccinations() {
      setStatus('loading')

      try {
        const data = await getVaccinations({
          search: debouncedSearch,
          animal: animalFilter || undefined,
          page,
        })

        if (!isActive) {
          return
        }

        setVaccinations(data.results)
        setTotalCount(data.count)
        setHasPreviousPage(Boolean(data.previous))
        setHasNextPage(Boolean(data.next))
        setStatus('success')
      } catch {
        if (isActive) {
          setStatus('error')
        }
      }
    }

    loadVaccinations()

    return () => {
      isActive = false
    }
  }, [debouncedSearch, animalFilter, page])

  return (
    <div className="visits-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Opieka medyczna</p>
          <h1>Szczepienia</h1>
          <p>
            Historia szczepień pacjentów oraz terminy kolejnych dawek.
          </p>
        </div>

        {canManageVaccinations && (
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setEditingVaccination(null)
              setFormStatus('idle')
              setIsCreateFormOpen(true)
            }}
          >
            Dodaj szczepienie
          </button>
        )}

        <div className="page-summary">
          <span>Łącznie</span>
          <strong>{totalCount}</strong>
        </div>
      </div>

      {canManageVaccinations && isCreateFormOpen && (
        <VaccinationForm
          animals={animals}
          veterinarians={veterinarians}
          initialValues={null}
          status={formStatus}
          onSubmit={handleCreateVaccination}
          onCancel={() => {
            setIsCreateFormOpen(false)
            setFormStatus('idle')
          }}
        />
      )}

      {canManageVaccinations && editingVaccination && (
        <VaccinationForm
          key={editingVaccination.id}
          animals={animals}
          veterinarians={veterinarians}
          initialValues={{
            animal: editingVaccination.animal,
            veterinarian: editingVaccination.veterinarian,
            vaccine_name: editingVaccination.vaccine_name,
            manufacturer: editingVaccination.manufacturer,
            batch_number: editingVaccination.batch_number,
            vaccination_date: editingVaccination.vaccination_date,
            next_due_date: editingVaccination.next_due_date,
            notes: editingVaccination.notes,
          }}
          status={formStatus}
          onSubmit={handleUpdateVaccination}
          onCancel={() => {
            setEditingVaccination(null)
            setFormStatus('idle')
          }}
        />
      )}

      <div className="list-toolbar">
        <input
            type="search"
            value={search}
            placeholder="Szukaj po szczepionce lub producencie..."
            aria-label="Szukaj szczepień"
            onChange={(event) => {
            setSearch(event.target.value)
            }}
        />
        <select
          value={animalFilter ?? ''}
          aria-label="Filtruj szczepienia po pacjencie"
          onChange={(event) => {
            const value = event.target.value

            setAnimalFilter(value ? Number(value) : null)
            setPage(1)
          }}
      >
          <option value="">Wszyscy pacjenci</option>

          {animals.map((animal) => (
            <option key={animal.id} value={animal.id}>
            {animal.name} — {animal.owner_name}
            </option>
         ))}
        </select>
      </div>

      {status === 'loading' && (
        <div className="data-card">
          <p>Ładowanie szczepień...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="data-card">
          <p>Nie udało się pobrać szczepień.</p>
        </div>
      )}

      {status === 'success' && vaccinations.length === 0 && (
        <div className="data-card empty-state">
          <h2>Brak zapisanych szczepień</h2>
          <p>Nie ma jeszcze zapisanych szczepień pacjentów.</p>
        </div>
      )}

      {status === 'success' && vaccinations.length > 0 && (
        <>
        <div className="data-card">
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pacjent</th>
                  <th>Szczepionka</th>
                  <th>Data szczepienia</th>
                  <th>Kolejna dawka</th>
                  <th>Lekarz</th>
                  {canManageVaccinations && <th>Akcje</th>}
                </tr>
              </thead>

              <tbody>
                {vaccinations.map((vaccination) => (
                  <tr key={vaccination.id}>
                    <td>
                      <div>
                        <strong>{vaccination.animal_name}</strong>
                      </div>
                      <div className="table-secondary">
                        {vaccination.animal_owner_name}
                      </div>
                    </td>

                    <td>
                      <div>
                        <strong>{vaccination.vaccine_name}</strong>
                      </div>
                      {vaccination.manufacturer && (
                        <div className="table-secondary">
                          {vaccination.manufacturer}
                        </div>
                      )}
                    </td>
                    <td>{vaccination.vaccination_date}</td>
                    <td>{vaccination.next_due_date || '—'}</td>
                    <td>{vaccination.veterinarian_name || '—'}</td>
                    {canManageVaccinations && (
                      <td>
                        <div className="table-actions">
                          <button
                            type="button"
                            className="table-action-button"
                            onClick={() => {
                              setFormStatus('idle')
                              setIsCreateFormOpen(false)
                              setEditingVaccination(vaccination)
                            }}
                          >
                            Edytuj
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
            className="secondary-button"
            disabled={!hasPreviousPage}
            onClick={() => {
              setPage((currentPage) => Math.max(1, currentPage - 1))
            }}
          >
            Poprzednia
          </button>

          <span>Strona {page}</span>

          <button
            type="button"
            className="secondary-button"
            disabled={!hasNextPage}
            onClick={() => {
              setPage((currentPage) => currentPage + 1)
            }}
          >
            Następna
          </button>
        </div>
        </>
      )}
    </div>
  )
}

export default VaccinationsPage