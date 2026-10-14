import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getNotifications } from '../services/notificationsService.js'

/** @type {Record<string, {title: string, path: string, linkText: string}>} */
const notificationTypes = {
  vaccination_due: {
    title: 'Zbliżające się szczepienie',
    path: '/vaccinations',
    linkText: 'Otwórz szczepienia',
  },
  prescription_expiring: {
    title: 'Wygasająca recepta',
    path: '/prescriptions',
    linkText: 'Otwórz recepty',
  },
  visit_today: {
    title: 'Dzisiejsza wizyta',
    path: '/visits',
    linkText: 'Otwórz wizyty',
  },
}

/**
 * @param {string} value
 * @returns {string}
 */
function formatDueDate(value) {
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value)
  const date = new Date(dateOnly ? `${value}T00:00:00` : value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return dateOnly
    ? date.toLocaleDateString('pl-PL')
    : date.toLocaleString('pl-PL', {
        dateStyle: 'short',
        timeStyle: 'short',
      })
}

/**
 * @param {{
 *   item: import('../services/notificationsService.js').NotificationItem
 * }} props
 */
function NotificationCard({ item }) {
  const details = notificationTypes[item.type]

  return (
    <article className="dashboard-panel">
      <h2>{details?.title ?? 'Powiadomienie'}</h2>

      <p>
        <strong>
          {item.severity === 'warning' ? 'Przypomnienie' : 'Informacja'}
        </strong>
      </p>

      <p>{item.message}</p>

      <p>
        Termin:{' '}
        <time dateTime={item.due_date}>
          {formatDueDate(item.due_date)}
        </time>
      </p>

      {details && (
        <Link to={details.path}>{details.linkText}</Link>
      )}
    </article>
  )
}

function NotificationsPage() {
  const [notifications, setNotifications] = useState(
    /** @type {import('../services/notificationsService.js').NotificationList | null} */
    (null),
  )
  const [status, setStatus] = useState('loading')
  const [requestVersion, setRequestVersion] = useState(0)

  useEffect(() => {
    let active = true

    async function loadNotifications() {
      try {
        const data = await getNotifications()

        if (active) {
          setNotifications(data)
          setStatus('loaded')
        }
      } catch {
        if (active) {
          setStatus('error')
        }
      }
    }

    loadNotifications()

    return () => {
      active = false
    }
  }, [requestVersion])

  function reloadNotifications() {
    setNotifications(null)
    setStatus('loading')
    setRequestVersion((version) => version + 1)
  }

  return (
    <div className="dashboard">
      <div className="page-heading">
        <div>
          <h1>Powiadomienia</h1>
          <p>Zbliżające się terminy i zaplanowane wizyty na dziś.</p>
        </div>

        <button
          className="primary-button"
          type="button"
          disabled={status === 'loading'}
          onClick={reloadNotifications}
        >
          {status === 'error' ? 'Spróbuj ponownie' : 'Odśwież dane'}
        </button>
      </div>

      {status === 'loading' && (
        <p role="status">Ładowanie powiadomień...</p>
      )}

      {status === 'error' && (
        <p role="alert">Nie udało się pobrać powiadomień.</p>
      )}

      {status === 'loaded' && notifications && (
        <>
          <div className="page-summary">
            <span>Aktualne powiadomienia</span>
            <strong>{notifications.count}</strong>
          </div>

          {notifications.items.length === 0 ? (
            <div className="empty-state">
              <h2>Brak aktualnych powiadomień</h2>
              <p>
                Nie ma wpisów spełniających kryteria przypomnień
                dla Twojego konta.
              </p>
            </div>
          ) : (
            <div className="dashboard-grid">
              {notifications.items.map((item) => (
                <NotificationCard
                  key={`${item.type}-${
                    item.vaccination_id ??
                    item.prescription_id ??
                    item.visit_id
                  }`}
                  item={item}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default NotificationsPage