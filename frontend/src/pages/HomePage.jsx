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
    <>
      <h1>Dashboard</h1>

      <section>
        <h2>Podsumowanie</h2>

        <ul>
          <li>Właściciele: {dashboard.owners_count}</li>
          <li>Zwierzęta: {dashboard.animals_count}</li>
          <li>Dzisiejsze wizyty: {dashboard.today_visits}</li>
          <li>Zaplanowane wizyty: {dashboard.scheduled_visits}</li>
          <li>Szczepienia do wykonania: {dashboard.vaccinations_due}</li>
          <li>Wygasające recepty: {dashboard.prescriptions_expiring}</li>
        </ul>
      </section>

      <section>
        <h2>Ostatnie wizyty</h2>

        {dashboard.recent_visits.length === 0 ? (
          <p>Brak ostatnich wizyt.</p>
        ) : (
          <ul>
            {dashboard.recent_visits.map((visit) => (
              <li key={visit.id}>
                {visit.animal__name} — {visit.reason} — {visit.status}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>Ostatnio dodane zwierzęta</h2>

        {dashboard.recent_animals.length === 0 ? (
          <p>Brak ostatnio dodanych zwierząt.</p>
        ) : (
          <ul>
            {dashboard.recent_animals.map((animal) => (
              <li key={animal.id}>
                {animal.name} — {animal.species} — właściciel:{' '}
                {animal.owner__last_name}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

export default HomePage