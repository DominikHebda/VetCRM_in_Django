import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

for (const [role, username] of [
  ['administrator', 'e2e_admin'],
  ['receptionist', 'e2e_receptionist'],
]) {
  test(`${role} creates an owner and sees the saved data after reload`, async ({
    page,
  }) => {
    const email = `e2e-${randomUUID()}@example.com`
    const phone = '500600700'
    const address = 'ul. Testowa 1, 00-001 Testowo'

    await loginAsUser(page, username)

    await page.getByRole('link', {
      name: 'Właściciele',
      exact: true,
    }).click()

    await expect(page.getByRole('heading', {
      name: 'Właściciele',
      exact: true,
    })).toBeVisible()

    await page.getByRole('button', {
      name: 'Dodaj właściciela',
      exact: true,
    }).click()

    const formHeading = page.getByRole('heading', {
      name: 'Nowy właściciel',
      exact: true,
    })

    await expect(formHeading).toBeVisible()

    await page.getByLabel('Imię', { exact: true }).fill('E2E')
    await page.getByLabel('Nazwisko', { exact: true }).fill('Testowy')
    await page.getByLabel('E-mail', { exact: true }).fill(email)
    await page.getByLabel('Telefon', { exact: true }).fill(phone)
    await page.getByLabel('Adres', { exact: true }).fill(address)

    await page.getByRole('button', {
      name: 'Zapisz właściciela',
      exact: true,
    }).click()

    await expect(formHeading).toHaveCount(0)

    const search = page.getByRole('searchbox', {
      name: 'Szukaj właścicieli',
      exact: true,
    })

    await search.fill(email)

    const ownerRow = page.getByRole('row').filter({
      has: page.getByRole('cell', { name: email, exact: true }),
    })

    await expect(ownerRow).toHaveCount(1)
    await expect(ownerRow.getByText('E2E Testowy', {
      exact: true,
    })).toBeVisible()

    await page.reload()

    await search.fill(email)

    await expect(ownerRow).toHaveCount(1)
    await expect(ownerRow.getByText('E2E Testowy', {
      exact: true,
    })).toBeVisible()
    await expect(ownerRow.getByRole('cell', {
      name: phone,
      exact: true,
    })).toBeVisible()
    await expect(ownerRow.getByRole('cell', {
      name: address,
      exact: true,
    })).toBeVisible()
  })
}