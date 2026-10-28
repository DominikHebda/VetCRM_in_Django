import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

for (const scenario of [
  {
    name: 'analytics',
    linkName: 'Analityka',
    apiPath: '/api/analytics/overview/',
    responseBody: {
      visits_by_month: [],
      animals_by_species: [],
      top_vaccines: [],
      top_medications: [],
      visits_by_veterinarian: [],
    },
    emptyText: 'Brak danych w tym zestawieniu.',
    emptyCount: 5,
  },
  {
    name: 'notifications',
    linkName: 'Powiadomienia',
    apiPath: '/api/notifications/',
    responseBody: {
      count: 0,
      items: [],
    },
    emptyText: 'Brak aktualnych powiadomień',
    emptyCount: 1,
  },
]) {
  test(`${scenario.name} shows an empty state before and after refresh`, async ({
    page,
  }) => {
    await loginAsUser(page, 'e2e_admin')

    await page.route(`**${scenario.apiPath}`, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue()
        return
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(scenario.responseBody),
      })
    })

    function waitForData() {
      return page.waitForResponse((response) => {
        const url = new URL(response.url())

        return (
          response.request().method() === 'GET' &&
          url.pathname === scenario.apiPath
        )
      })
    }

    async function checkEmptyState() {
      await expect(page.getByText(scenario.emptyText, {
        exact: true,
      })).toHaveCount(scenario.emptyCount)

      await expect(page.getByRole('alert')).toHaveCount(0)

      if (scenario.name === 'analytics') {
        for (const title of [
          'Wizyty według miesiąca',
          'Zwierzęta według gatunku',
          'Najczęstsze szczepienia',
          'Najczęściej przepisywane leki',
          'Wizyty według lekarza',
        ]) {
          const region = page.getByRole('region', {
            name: title,
            exact: true,
          })

          await expect(region).toBeVisible()

          await expect(region.getByText(scenario.emptyText, {
            exact: true,
          })).toBeVisible()

          await expect(region.getByRole('table')).toHaveCount(0)
        }
      } else {
        await expect(page.getByRole('heading', {
          name: scenario.emptyText,
          exact: true,
        })).toBeVisible()

        await expect(page.getByRole('article')).toHaveCount(0)

        await expect(
          page.locator('.page-summary strong'),
        ).toHaveText('0')
      }
    }

    const initialResponse = waitForData()

    await page.getByRole('link', {
      name: scenario.linkName,
      exact: true,
    }).click()

    expect((await initialResponse).status()).toBe(200)

    await checkEmptyState()

    const refreshButton = page.getByRole('button', {
      name: 'Odśwież dane',
      exact: true,
    })

    await expect(refreshButton).toBeEnabled()

    const refreshResponse = waitForData()

    await refreshButton.click()

    expect((await refreshResponse).status()).toBe(200)

    await checkEmptyState()
    await expect(refreshButton).toBeEnabled()
  })
}