import { useEffect, useState } from 'react'

import { getVaccinations } from '../services/vaccinationsService.js'

function VaccinationsPage() {
  const [vaccinations, setVaccinations] = useState(
  /** @type {import('../services/vaccinationsService.js').Vaccination[]} */ ([]),
  )
  const [totalCount, setTotalCount] = useState(0)
  const [status, setStatus] = useState('loading')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
    }, [search])

  useEffect(() => {
    let isActive = true

    async function loadVaccinations() {
      setStatus('loading')

      try {
        const data = await getVaccinations({
          search: debouncedSearch,
        })

        if (!isActive) {
          return
        }

        setVaccinations(data.results)
        setTotalCount(data.count)
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
  }, [debouncedSearch])

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

        <div className="page-summary">
          <span>Łącznie</span>
          <strong>{totalCount}</strong>
        </div>
      </div>

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
                </tr>
              </thead>

              <tbody>
                {vaccinations.map((vaccination) => (
                  <tr key={vaccination.id}>
                    <td>
                      <strong>{vaccination.animal_name}</strong>
                      <span className="table-secondary">
                        {vaccination.animal_owner_name}
                      </span>
                    </td>
                    <td>
                      <strong>{vaccination.vaccine_name}</strong>
                      {vaccination.manufacturer && (
                        <span className="table-secondary">
                          {vaccination.manufacturer}
                        </span>
                      )}
                    </td>
                    <td>{vaccination.vaccination_date}</td>
                    <td>{vaccination.next_due_date || '—'}</td>
                    <td>{vaccination.veterinarian_name || '—'}</td>
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

export default VaccinationsPage