import { useEffect, useState } from 'react'

import MedicalRecordForm from '../components/MedicalRecordForm.jsx'
import { useAuth } from '../auth/useAuth.js'
import { getVisits } from '../services/visitsService.js'

import {
    createMedicalRecord,
    getMedicalRecords
} from '../services/medicalRecordsService.js'
import { getAnimals } from '../services/animalsService.js'

/**
 * @typedef {Object} MedicalRecord
 * @property {number} id
 * @property {number} visit
 * @property {string} animal_name
 * @property {'dog' | 'cat' | 'other'} animal_species
 * @property {string} animal_owner_name
 * @property {string} diagnosis
 * @property {string} treatment
 * @property {string} recommendations
 * @property {string | null} weight
 * @property {string | null} temperature
 */

/**
 * @typedef {Object} Animal
 * @property {number} id
 * @property {string} name
 * @property {string} owner_name
 */

/**
 * @typedef {Object} Visit
 * @property {number} id
 * @property {string} animal_name
 * @property {string} animal_owner_name
 * @property {string} visit_date
 * @property {boolean} has_medical_record
 */

const speciesLabels = {
  dog: 'pies',
  cat: 'kot',
  other: 'inne',
}

function MedicalRecordsPage() {
  const { user } = useAuth()
  const canManageMedicalRecords =
    user?.role === 'ADMIN' || user?.role === 'VET'
  const [medicalRecords, setMedicalRecords] = useState(
    /** @type {MedicalRecord[]} */ ([]),
  )
  const [visits, setVisits] = useState(
    /** @type {Visit[]} */ ([]),
  )
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [formStatus, setFormStatus] = useState(
    /** @type {'idle' | 'saving' | 'error'} */ ('idle'),
  )
  const [status, setStatus] = useState('loading')
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasPreviousPage, setHasPreviousPage] = useState(false)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [animals, setAnimals] = useState(
  /** @type {Animal[]} */ ([]),
  )
  const [animalFilter, setAnimalFilter] = useState(
  /** @type {number | null} */ (null),
  )

  /**
   * @param {{
   *   visit: number,
   *   diagnosis: string,
   *   treatment: string,
   *   recommendations: string,
   *   weight: string | null,
   *   temperature: string | null,
   * }} medicalRecord
   */
  async function handleCreateMedicalRecord(medicalRecord) {
    setFormStatus('saving')

    try {
      await createMedicalRecord(medicalRecord)

      const data = await getMedicalRecords({
        search: debouncedSearch,
        animal: animalFilter,
        page,
      })

      setMedicalRecords(data.results)
      setTotalCount(data.count)
      setHasPreviousPage(Boolean(data.previous))
      setHasNextPage(Boolean(data.next))

      setVisits((currentVisits) =>
        currentVisits.filter(
          (visit) => visit.id !== medicalRecord.visit,
        ),
      )

      setFormStatus('idle')
      setIsCreateFormOpen(false)
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
    let isMounted = true

    async function loadAnimals() {
      try {
        const data = await getAnimals({ pageSize: 100 })

        if (isMounted) {
          setAnimals(data.results)
        }
      } catch {
        if (isMounted) {
          setAnimals([])
       }
      }
    }

    loadAnimals()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!canManageMedicalRecords) {
      return undefined
    }

    let isMounted = true

    async function loadVisits() {
      try {
        const data = await getVisits({ pageSize: 100 })

        if (isMounted) {
          setVisits(
            data.results.filter(
              (visit) => !visit.has_medical_record,
            ),
          )
        }
      } catch {
        if (isMounted) {
          setVisits([])
        }
      }
    }

    loadVisits()

    return () => {
      isMounted = false
    }
  }, [canManageMedicalRecords])

  useEffect(() => {
    let isMounted = true

    async function loadMedicalRecords() {
      setStatus('loading')

      try {
        const data = await getMedicalRecords({
          search: debouncedSearch,
          animal: animalFilter,
          page,
        })

        if (!isMounted) {
          return
        }

        setMedicalRecords(data.results)
        setTotalCount(data.count)
        setHasPreviousPage(Boolean(data.previous))
        setHasNextPage(Boolean(data.next))
        setStatus('success')
      } catch {
        if (isMounted) {
          setStatus('error')
        }
      }
    }

    loadMedicalRecords()

    return () => {
      isMounted = false
    }
  }, [debouncedSearch, animalFilter, page])

  return (
    <div className="visits-page">
      <div className="page-heading">
        <div>
          <h1>Dokumentacja medyczna</h1>
          <p>
            Diagnozy, leczenie i zalecenia zapisane podczas wizyt.
          </p>
        </div>

        {canManageMedicalRecords && (
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setIsCreateFormOpen(true)
              setFormStatus('idle')
            }}
          >
            Dodaj dokumentację
          </button>
        )}

        <div className="page-summary">
          <span>Łącznie</span>
          <strong>{totalCount}</strong>
        </div>
      </div>

      {canManageMedicalRecords && isCreateFormOpen && (
        <MedicalRecordForm
          visits={visits}
          initialValues={null}
          status={formStatus}
          onSubmit={handleCreateMedicalRecord}
          onCancel={() => {
          setFormStatus('idle')
          setIsCreateFormOpen(false)
          }}
        />
      )}

      <div className="list-toolbar">
        <input
            type="search"
            value={search}
            placeholder="Szukaj po diagnozie lub leczeniu..."
            aria-label="Szukaj dokumentacji medycznej"
            onChange={(event) => {
            setSearch(event.target.value)
            }}
        />
        <select
            value={animalFilter ?? ''}
            aria-label="Filtruj po pacjencie"
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
        <div className="empty-state">
          <h2>Ładowanie dokumentacji...</h2>
        </div>
      )}

      {status === 'error' && (
        <div className="empty-state">
          <h2>Nie udało się pobrać dokumentacji</h2>
          <p>Spróbuj ponownie za chwilę.</p>
        </div>
      )}

      {status === 'success' && medicalRecords.length === 0 && (
        <div className="empty-state">
          <h2>Brak dokumentacji medycznej</h2>
          <p>Nie ma jeszcze zapisanych rekordów medycznych.</p>
        </div>
      )}

      {status === 'success' && medicalRecords.length > 0 && (
        <>
          <div className="data-card">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Pacjent</th>
                    <th>Diagnoza</th>
                    <th>Leczenie</th>
                    <th>Waga</th>
                    <th>Temperatura</th>
                  </tr>
                </thead>

                <tbody>
                  {medicalRecords.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <strong>{record.animal_name}</strong>
                        <div className="table-secondary">
                          {speciesLabels[record.animal_species]} ·{' '}
                          {record.animal_owner_name}
                        </div>
                      </td>

                      <td>{record.diagnosis}</td>
                      <td>{record.treatment || '—'}</td>
                      <td>
                        {record.weight !== null
                          ? `${record.weight} kg`
                          : '—'}
                      </td>
                      <td>
                        {record.temperature !== null
                          ? `${record.temperature} °C`
                          : '—'}
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

export default MedicalRecordsPage