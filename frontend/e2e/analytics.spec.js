import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

const analyticsApiUrl = 'http://127.0.0.1:8002/api/analytics/overview/'

for (const [role, username] of [
  ['administrator', 'e2e_admin'],
  ['veterinarian', 'e2e_vet'],
]) {
  test(`${role} can open analytics`, async ({ page }) => {
    await loginAsUser(page, username)

    const responsePromise = page.waitForResponse(
      (response) =>
        response.url() === analyticsApiUrl &&
        response.request().method() === 'GET',
    )

    await page.getByRole('link', {
      name: 'Analityka',
      exact: true,
    }).click()

    expect((await responsePromise).status()).toBe(200)
    await expect(page).toHaveURL('http://127.0.0.1:5174/analytics')

    for (const title of [
      'Statystyki',
      'Wizyty według miesiąca',
      'Zwierzęta według gatunku',
      'Najczęstsze szczepienia',
      'Najczęściej przepisywane leki',
      'Wizyty według lekarza',
    ]) {
      await expect(page.getByRole('heading', {
        name: title,
        exact: true,
      })).toBeVisible()
    }

    await page.reload()

    await expect(page.getByRole('heading', {
      name: 'Statystyki',
      exact: true,
    })).toBeVisible()
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