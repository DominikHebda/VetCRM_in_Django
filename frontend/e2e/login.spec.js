import { expect, test } from '@playwright/test'

/**
 * @param {import('@playwright/test').Page} page
 */
async function loginAsAdmin(page) {
  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
  await page.getByRole('button', {
    name: 'Zaloguj przez OAuth 2.0',
    exact: true,
  }).click()

  await expect(page.getByRole('heading', {
    name: 'Logowanie do VetCRM',
    exact: true,
  })).toBeVisible()

  await page.getByLabel('Nazwa użytkownika', { exact: true }).fill('e2e_admin')
  await page.getByLabel('Hasło', { exact: true }).fill('E2e-Login-Only-42!')
  await page.getByRole('button', { name: 'Zaloguj', exact: true }).click()

  await expect(page).toHaveURL('http://127.0.0.1:5174/')
  await expect(page.getByRole('heading', {
    name: 'Dashboard',
    exact: true,
  })).toBeVisible()
  await expect(page.getByText('e2e_admin', { exact: true })).toBeVisible()
}

test('administrator logs in through OAuth and opens the dashboard', async ({
  page,
}) => {
  await loginAsAdmin(page)

  await page.reload()

  await expect(page.getByRole('heading', {
    name: 'Dashboard',
    exact: true,
  })).toBeVisible()
})

test('logout ends the session and requires credentials again', async ({
  page,
}) => {
  await loginAsAdmin(page)

  await page.getByRole('button', {
    name: 'Wyloguj',
    exact: true,
  }).click()

  await expect(page).toHaveURL(/\/login$/)
  await expect(page.getByRole('button', {
    name: 'Zaloguj przez OAuth 2.0',
    exact: true,
  })).toBeVisible()

  await loginAsAdmin(page)
})
