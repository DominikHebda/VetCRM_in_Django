import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

for (const scenario of [
  {
    name: 'analytics',
    linkName: 'Analityka',
    apiPath: '/api/analytics/overview/',
    errorMessage: 'Nie udało się pobrać statystyk.',
    loadedText: 'Zestawienia wszystkich danych zapisanych w klinice.',
  },
  {
    name: 'notifications',
    linkName: 'Powiadomienia',
    apiPath: '/api/notifications/',
    errorMessage: 'Nie udało się pobrać powiadomień.',
    loadedText: 'Aktualne powiadomienia',
  },
]) {
  test(`${scenario.name} recovers after an API error and retry`, async ({
    page,
  }) => {
    await loginAsUser(page, 'e2e_admin')

    let failRequests = true

    await page.route(`**${scenario.apiPath}`, async (route) => {
      if (
        route.request().method() === 'GET' &&
        failRequests
      ) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            detail: 'Simulated API failure for E2E.',
          }),
        })
        return
      }

      await route.continue()
    })

    const failedResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'GET' &&
        url.pathname === scenario.apiPath &&
        response.status() === 500
      )
    })

    await page.getByRole('link', {
      name: scenario.linkName,
      exact: true,
    }).click()

    expect((await failedResponse).status()).toBe(500)

    const errorAlert = page.getByRole('alert')

    await expect(errorAlert).toHaveText(scenario.errorMessage)

    const retryButton = page.getByRole('button', {
      name: 'Spróbuj ponownie',
      exact: true,
    })

    await expect(retryButton).toBeVisible()
    await expect(retryButton).toBeEnabled()

    failRequests = false

    const recoveryResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'GET' &&
        url.pathname === scenario.apiPath
      )
    })

    await retryButton.click()

    expect((await recoveryResponse).status()).toBe(200)

    await expect(page.getByText(scenario.loadedText, {
      exact: true,
    })).toBeVisible()

    await expect(errorAlert).toHaveCount(0)
    await expect(retryButton).toHaveCount(0)

    await expect(page.getByRole('button', {
      name: 'Odśwież dane',
      exact: true,
    })).toBeEnabled()
  })
}