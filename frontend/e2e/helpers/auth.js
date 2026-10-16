import { expect } from '@playwright/test'

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} username
 */
async function loginAsUser(page, username) {
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

  await page.getByLabel('Nazwa użytkownika', { exact: true }).fill(username)
  await page.getByLabel('Hasło', { exact: true }).fill('E2e-Login-Only-42!')
  await page.getByRole('button', { name: 'Zaloguj', exact: true }).click()

  await expect(page).toHaveURL('http://127.0.0.1:5174/')
  await expect(page.getByRole('heading', {
    name: 'Dashboard',
    exact: true,
  })).toBeVisible()
  await expect(page.getByText(username, { exact: true })).toBeVisible()
}

export { loginAsUser }