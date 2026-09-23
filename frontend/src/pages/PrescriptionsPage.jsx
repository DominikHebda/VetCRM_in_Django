import { useEffect, useState } from 'react'

import { getAnimals } from '../services/animalsService.js'
import { getPrescriptions } from '../services/prescriptionsService.js'

function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState(
    /** @type {import('../services/prescriptionsService.js').Prescription[]} */ ([]),
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
    let isActive = true

    async function loadPrescriptions() {
      setStatus('loading')

      try {
        const data = await getPrescriptions({
          search: debouncedSearch,
          animal: animalFilter || undefined,
          page,
        })

        if (!isActive) {
          return
        }

        setPrescriptions(data.results)
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

    loadPrescriptions()

    return () => {
      isActive = false
    }
  }, [debouncedSearch, animalFilter, page])

  return (
    <div className="visits-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Opieka medyczna</p>
          <h1>Recepty</h1>
          <p>
            Recepty wystawione pacjentom oraz informacje o zaleconym leczeniu.
          </p>
        </div>

        <div className="page-summary">
          <span>Łącznie</span>
          <strong>{totalCount}</strong>
        </div>
      </div>

      <div className="list-toolbar">
        <input
          type="search"
          value={search}
          placeholder="Szukaj po leku, substancji lub numerze recepty..."
          aria-label="Szukaj recept"
          onChange={(event) => {
            setSearch(event.target.value)
          }}
        />

        <select
          value={animalFilter ?? ''}
          aria-label="Filtruj recepty po pacjencie"
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
          <p>Ładowanie recept...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="data-card">
          <p>Nie udało się pobrać recept.</p>
        </div>
      )}

      {status === 'success' && prescriptions.length === 0 && (
        <div className="data-card empty-state">
          <h2>Brak zapisanych recept</h2>
          <p>Nie ma jeszcze zapisanych recept pacjentów.</p>
        </div>
      )}

      {status === 'success' && prescriptions.length > 0 && (
        <>
          <div className="data-card">
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pacjent</th>
                    <th>Recepta</th>
                    <th>Lek</th>
                    <th>Dawkowanie</th>
                    <th>Data wystawienia</th>
                    <th>Ważna do</th>
                    <th>Lekarz</th>
                  </tr>
                </thead>

                <tbody>
                  {prescriptions.map((prescription) => (
                    <tr key={prescription.id}>
                      <td>
                        <div>
                          <strong>{prescription.animal_name}</strong>
                        </div>
                        <div className="table-secondary">
                          {prescription.animal_owner_name}
                        </div>
                      </td>

                      <td>{prescription.prescription_number}</td>

                      <td>
                        <div>
                          <strong>{prescription.medication_name}</strong>
                        </div>

                        {prescription.active_substance && (
                          <div className="table-secondary">
                            {prescription.active_substance}
                          </div>
                        )}
                      </td>

                      <td>
                        <div>{prescription.dosage}</div>
                        <div className="table-secondary">
                          {prescription.frequency}
                        </div>
                      </td>

                      <td>{prescription.issue_date}</td>
                      <td>{prescription.valid_until}</td>
                      <td>{prescription.veterinarian_name || '—'}</td>
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

export default PrescriptionsPage