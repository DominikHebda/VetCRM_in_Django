import { useEffect, useState } from 'react'

import { getMedicalRecords } from '../services/medicalRecordsService.js'

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

const speciesLabels = {
  dog: 'pies',
  cat: 'kot',
  other: 'inne',
}

function MedicalRecordsPage() {
  const [medicalRecords, setMedicalRecords] = useState(
    /** @type {MedicalRecord[]} */ ([]),
  )
  const [status, setStatus] = useState('loading')
  const [totalCount, setTotalCount] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
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
    let isMounted = true

    async function loadMedicalRecords() {
      setStatus('loading')

      try {
        const data = await getMedicalRecords({
          search: debouncedSearch,
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
  }, [debouncedSearch, page])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <p className="eyebrow">Dokumentacja kliniczna</p>
          <h1>Dokumentacja medyczna</h1>
          <p>
            Diagnozy, leczenie i zalecenia zapisane podczas wizyt.
          </p>
        </div>

        <div className="page-count">
          <span>Rekordy</span>
          <strong>{totalCount}</strong>
        </div>
      </div>

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