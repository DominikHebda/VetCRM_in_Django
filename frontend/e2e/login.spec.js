import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

test('administrator logs in through OAuth and opens the dashboard', async ({
  page,
}) => {
  await loginAsUser(page, 'e2e_admin')

  await page.reload()

  await expect(page.getByRole('heading', {
    name: 'Dashboard',
    exact: true,
  })).toBeVisible()
})

test('logout ends the session and requires credentials again', async ({
  page,
}) => {
  await loginAsUser(page, 'e2e_admin')

  await page.getByRole('button', {
    name: 'Wyloguj',
    exact: true,
  }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', {
    name: 'Zaloguj przez OAuth 2.0',
    exact: true,
  })).toBeVisible()

  await loginAsUser(page, 'e2e_admin')
})
