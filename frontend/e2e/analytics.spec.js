import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

const analyticsApiUrl = 'http://127.0.0.1:8002/api/analytics/overview/'

/**
 * @param {import('@playwright/test').Page} page
 * @param {import('../src/services/analyticsService.js').AnalyticsOverview} data
 */
async function checkAnalyticsTables(page, data) {
  const monthFormatter = new Intl.DateTimeFormat('pl-PL', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  const panels = [
    {
      title: 'Wizyty według miesiąca',
      rows: data.visits_by_month.map((row) => ({
        label: monthFormatter.format(
          new Date(`${row.month.slice(0, 7)}-01T00:00:00Z`),
        ),
        count: row.count,
      })),
    },
    {
      title: 'Zwierzęta według gatunku',
      rows: data.animals_by_species.map((row) => ({
        label: row.species || 'Nie podano gatunku',
        count: row.count,
      })),
    },
    {
      title: 'Najczęstsze szczepienia',
      rows: data.top_vaccines.map((row) => ({
        label: row.vaccine_name || 'Nie podano nazwy',
        count: row.count,
      })),
    },
    {
      title: 'Najczęściej przepisywane leki',
      rows: data.top_medications.map((row) => ({
        label: row.medication_name || 'Nie podano nazwy',
        count: row.count,
      })),
    },
    {
      title: 'Wizyty według lekarza',
      rows: data.visits_by_veterinarian.map((row) => ({
        label:
          [
            row.veterinarian__first_name,
            row.veterinarian__last_name,
          ].filter(Boolean).join(' ') || `Lekarz #${row.veterinarian_id}`,
        count: row.count,
      })),
    },
  ]

  await expect(page.getByRole('heading', {
    name: 'Statystyki',
    exact: true,
  })).toBeVisible()

  for (const panel of panels) {
    // Seed przygotowuje dane do każdego z pięciu zestawień.
    expect(panel.rows.length).toBeGreaterThan(0)

    const region = page.getByRole('region', {
      name: panel.title,
      exact: true,
    })

    await expect(region).toBeVisible()

    const table = region.getByRole('table')

    // Jeden wiersz nagłówka i wiersze danych.
    await expect(table.getByRole('row')).toHaveCount(
      panel.rows.length + 1,
    )

    for (const expectedRow of panel.rows) {
      const row = table.getByRole('row').filter({
        has: page.getByRole('rowheader', {
          name: expectedRow.label,
          exact: true,
        }),
      })

      await expect(row).toHaveCount(1)

      await expect(row.getByRole('cell')).toHaveText(
        String(expectedRow.count),
      )
    }
  }
}

for (const [role, username] of [
  ['administrator', 'e2e_admin'],
  ['veterinarian', 'e2e_vet'],
]) {
  test(`${role} sees analytics data after refresh and reload`, async ({
    page,
  }) => {
    await loginAsUser(page, username)

    /**
     * @returns {Promise<import('@playwright/test').Response>}
     */
    function waitForAnalytics() {
      return page.waitForResponse(
        (response) =>
          response.url() === analyticsApiUrl &&
          response.request().method() === 'GET',
      )
    }

    const initialResponsePromise = waitForAnalytics()

    await page.getByRole('link', {
      name: 'Analityka',
      exact: true,
    }).click()

    const initialResponse = await initialResponsePromise
    expect(initialResponse.status()).toBe(200)

    await expect(page).toHaveURL(
      'http://127.0.0.1:5174/analytics',
    )

    await checkAnalyticsTables(page, await initialResponse.json())

    const refreshResponsePromise = waitForAnalytics()

    await page.getByRole('button', {
      name: 'Odśwież dane',
      exact: true,
    }).click()

    const refreshResponse = await refreshResponsePromise
    expect(refreshResponse.status()).toBe(200)

    await checkAnalyticsTables(page, await refreshResponse.json())

    const reloadResponsePromise = waitForAnalytics()

    await page.reload()

    const reloadResponse = await reloadResponsePromise
    expect(reloadResponse.status()).toBe(200)

    await checkAnalyticsTables(page, await reloadResponse.json())
  })
}

test('receptionist cannot open analytics', async ({ page }) => {
  await loginAsUser(page, 'e2e_receptionist')

  await expect(page.getByRole('link', {
    name: 'Analityka',
    exact: true,
  })).toHaveCount(0)

  /** @type {string[]} */
  const analyticsRequests = []

  page.on('request', (request) => {
    if (
      request.url() === analyticsApiUrl &&
      request.method() === 'GET'
    ) {
      analyticsRequests.push(request.url())
    }
  })

  await page.goto('/analytics')

  await expect(page).toHaveURL('http://127.0.0.1:5174/')
  await expect(page.getByRole('heading', {
    name: 'Dashboard',
    exact: true,
  })).toBeVisible()

  expect(analyticsRequests).toHaveLength(0)
})