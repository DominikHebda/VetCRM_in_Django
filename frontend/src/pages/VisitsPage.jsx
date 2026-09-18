import { useEffect, useState } from 'react'

import { getVisits } from '../services/visitsService.js'

/**
 * @typedef {Object} Visit
 * @property {number} id
 * @property {number} animal
 * @property {string} animal_name
 * @property {number} veterinarian
 * @property {string} veterinarian_name
 * @property {string} visit_date
 * @property {string} reason
 * @property {string} notes
 * @property {'SCHEDULED' | 'COMPLETED' | 'CANCELLED'} status
 */

const statusLabels = {
  SCHEDULED: 'Zaplanowana',
  COMPLETED: 'Zakończona',
  CANCELLED: 'Anulowana',
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
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [search])

  useEffect(() => {
    let isMounted = true

    async function loadVisits() {
      try {
        const data = await getVisits({
            search: debouncedSearch,
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
  }, [debouncedSearch, page])

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

        <div className="page-summary">
          <span>Łącznie</span>
          <strong>{totalCount}</strong>
        </div>
      </div>

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
                    </tr>
                </thead>

                <tbody>
                    {visits.map((visit) => (
                    <tr key={visit.id}>
                        <td>{formatVisitDate(visit.visit_date)}</td>
                        <td>
                        <strong>{visit.animal_name}</strong>
                        </td>
                        <td>{visit.veterinarian_name || '—'}</td>
                        <td>{visit.reason}</td>
                        <td>
                        {statusLabels[visit.status] ?? visit.status}
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