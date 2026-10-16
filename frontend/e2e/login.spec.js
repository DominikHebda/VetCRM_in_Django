import { expect, test } from '@playwright/test'

test('administrator logs in through OAuth and opens the dashboard', async ({
  page,
}) => {
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

  await page.reload()

  await expect(page.getByRole('heading', {
    name: 'Dashboard',
    exact: true,
  })).toBeVisible()
})