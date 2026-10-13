import { useEffect, useState } from 'react'

import { getAnalyticsOverview } from '../services/analyticsService.js'

import { Navigate } from 'react-router-dom'

import { canViewAnalytics } from '../auth/permissions.js'
import { useAuth } from '../auth/useAuth.js'

const monthFormatter = new Intl.DateTimeFormat('pl-PL', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

/**
 * @param {string} value
 * @returns {string}
 */

function formatMonth(value) {
  return monthFormatter.format(new Date(`${value.slice(0, 7)}-01T00:00:00Z`))
}

/**
 * @typedef {Object} AnalyticsRow
 * @property {string | number} key
 * @property {string} label
 * @property {number} count
 */

/**
 * @param {{
 *   id: string,
 *   title: string,
 *   labelHeading: string,
 *   rows: AnalyticsRow[]
 * }} props
 */

function AnalyticsPanel({ id, title, labelHeading, rows }) {
  return (
    <section className="dashboard-panel" aria-labelledby={id}>
      <h2 id={id}>{title}</h2>

      {rows.length === 0 ? (
        <p className="dashboard-empty">Brak danych w tym zestawieniu.</p>
      ) : (
        <div className="analytics-table-wrapper">
          <table className="analytics-table">
            <thead>
              <tr>
                <th scope="col">{labelHeading}</th>
                <th scope="col">Liczba</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">{row.label}</th>
                  <td>{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function AnalyticsContent() {
  const [analytics, setAnalytics] = useState(
    /** @type {import('../services/analyticsService.js').AnalyticsOverview | null} */
    (null),
  )
  const [status, setStatus] = useState('loading')
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    let active = true

    async function loadAnalytics() {
      try {
        const data = await getAnalyticsOverview()

        if (active) {
          setAnalytics(data)
          setStatus('loaded')
        }
      } catch {
        if (active) {
          setStatus('error')
        }
      }
    }

    loadAnalytics()

    return () => {
      active = false
    }
  }, [requestVersion])

  function reloadAnalytics() {
    setAnalytics(null)
    setStatus('loading')
    setRequestVersion((version) => version + 1)
  }

  if (status === 'loading') {
    return <p role="status">Ładowanie statystyk...</p>
  }

  if (status === 'error') {
    return (
      <div>
        <p role="alert">Nie udało się pobrać statystyk.</p>
        <button type="button" onClick={reloadAnalytics}>
          Spróbuj ponownie
        </button>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="dashboard">
      <div className="dashboard-heading analytics-heading">
        <div>
          <h1>Statystyki</h1>
          <p>Zestawienia wszystkich danych zapisanych w klinice.</p>
        </div>

        <button type="button" onClick={reloadAnalytics}>
          Odśwież dane
        </button>
      </div>

      <p className="dashboard-empty">
        Wizyty są liczone niezależnie od statusu. Rankingi szczepień
        i leków pokazują do pięciu najczęstszych pozycji.
      </p>

      <div className="dashboard-grid">
        <AnalyticsPanel
          id="analytics-months"
          title="Wizyty według miesiąca"
          labelHeading="Miesiąc"
          rows={analytics.visits_by_month.map((row) => ({
            key: row.month,
            label: formatMonth(row.month),
            count: row.count,
          }))}
        />

        <AnalyticsPanel
          id="analytics-species"
          title="Zwierzęta według gatunku"
          labelHeading="Gatunek"
          rows={analytics.animals_by_species.map((row) => ({
            key: row.species,
            label: row.species || 'Nie podano gatunku',
            count: row.count,
          }))}
        />

        <AnalyticsPanel
          id="analytics-vaccines"
          title="Najczęstsze szczepienia"
          labelHeading="Szczepionka"
          rows={analytics.top_vaccines.map((row) => ({
            key: row.vaccine_name,
            label: row.vaccine_name || 'Nie podano nazwy',
            count: row.count,
          }))}
        />

        <AnalyticsPanel
          id="analytics-medications"
          title="Najczęściej przepisywane leki"
          labelHeading="Lek"
          rows={analytics.top_medications.map((row) => ({
            key: row.medication_name,
            label: row.medication_name || 'Nie podano nazwy',
            count: row.count,
          }))}
        />

        <AnalyticsPanel
          id="analytics-veterinarians"
          title="Wizyty według lekarza"
          labelHeading="Lekarz"
          rows={analytics.visits_by_veterinarian.map((row) => ({
            key: row.veterinarian_id,
            label:
              [
                row.veterinarian__first_name,
                row.veterinarian__last_name,
              ].filter(Boolean).join(' ') || `Lekarz #${row.veterinarian_id}`,
            count: row.count,
          }))}
        />
      </div>
    </div>
  )
}

function AnalyticsPage() {
  const { user } = useAuth()

  if (!canViewAnalytics(user)) {
    return <Navigate to="/" replace />
  }

  return <AnalyticsContent />
}

export default AnalyticsPage