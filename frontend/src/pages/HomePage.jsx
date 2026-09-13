import { useEffect, useState } from 'react'

import { getDashboardSummary } from '../services/dashboardService.js'

/**
 * @typedef {Object} DashboardSummary
 * @property {number} owners_count
 * @property {number} animals_count
 * @property {number} today_visits
 * @property {number} scheduled_visits
 * @property {number} vaccinations_due
 * @property {number} prescriptions_expiring
 * @property {Array<{
 *   id: number,
 *   visit_date: string,
 *   reason: string,
 *   status: string,
 *   animal__name: string
 * }>} recent_visits
 * @property {Array<{
 *   id: number,
 *   name: string,
 *   species: string,
 *   owner__last_name: string
 * }>} recent_animals
 */

function HomePage() {
  const [dashboard, setDashboard] = useState(
  /** @type {DashboardSummary | null} */ (null),
)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    async function loadDashboard() {
      try {
        const data = await getDashboardSummary()
        setDashboard(data)
        setStatus('loaded')
      } catch {
        setStatus('error')
      }
    }

    loadDashboard()
  }, [])

  if (status === 'loading') {
    return <p>Ładowanie dashboardu...</p>
  }

  if (status === 'error') {
    return <p>Nie udało się pobrać danych dashboardu.</p>
  }

  if (!dashboard) {
  return null
  }

  return (
  <div className="dashboard">
    <div className="dashboard-heading">
      <div>
        <h1>Dashboard</h1>
        <p>Podsumowanie najważniejszych informacji w klinice.</p>
      </div>
    </div>

    <section className="dashboard-stats">
      <article className="dashboard-card">
        <span>Właściciele</span>
        <strong>{dashboard.owners_count}</strong>
      </article>

      <article className="dashboard-card">
        <span>Zwierzęta</span>
        <strong>{dashboard.animals_count}</strong>
      </article>

      <article className="dashboard-card">
        <span>Dzisiejsze wizyty</span>
        <strong>{dashboard.today_visits}</strong>
      </article>

      <article className="dashboard-card">
        <span>Zaplanowane wizyty</span>
        <strong>{dashboard.scheduled_visits}</strong>
      </article>

      <article className="dashboard-card">
        <span>Szczepienia do wykonania</span>
        <strong>{dashboard.vaccinations_due}</strong>
      </article>

      <article className="dashboard-card">
        <span>Wygasające recepty</span>
        <strong>{dashboard.prescriptions_expiring}</strong>
      </article>
    </section>

    <div className="dashboard-grid">
      <section className="dashboard-panel">
        <h2>Ostatnie wizyty</h2>

        {dashboard.recent_visits.length === 0 ? (
          <p className="dashboard-empty">Brak ostatnich wizyt.</p>
        ) : (
          <div className="dashboard-list">
            {dashboard.recent_visits.map((visit) => (
              <article key={visit.id} className="dashboard-list-item">
                <div>
                  <strong>{visit.animal__name}</strong>
                  <p>{visit.reason}</p>
                </div>

                <span>{visit.status}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="dashboard-panel">
        <h2>Ostatnio dodane zwierzęta</h2>

        {dashboard.recent_animals.length === 0 ? (
          <p className="dashboard-empty">
            Brak ostatnio dodanych zwierząt.
          </p>
        ) : (
          <div className="dashboard-list">
            {dashboard.recent_animals.map((animal) => (
              <article key={animal.id} className="dashboard-list-item">
                <div>
                  <strong>{animal.name}</strong>
                  <p>{animal.species}</p>
                </div>

                <span>{animal.owner__last_name}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  </div>
)
}

export default HomePage