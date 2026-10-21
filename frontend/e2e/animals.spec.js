import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

for (const [role, username] of [
  ['administrator', 'e2e_admin'],
  ['receptionist', 'e2e_receptionist'],
]) {
  test(`${role} creates an animal and sees saved data after reload`, async ({
    page,
  }) => {
    const name = `E2E-${randomUUID()}`
    const breed = 'Rasa testowa'
    const birthDate = '2020-05-15'
    const chipNumber = String(Date.now()).padStart(15, '0')
    const notes = 'Notatka zapisana przez test E2E.'

    await loginAsUser(page, username)

    await page.getByRole('link', {
      name: 'Zwierzęta',
      exact: true,
    }).click()

    await expect(page.getByRole('heading', {
      name: 'Zwierzęta',
      exact: true,
    })).toBeVisible()

    await page.getByRole('button', {
      name: 'Dodaj zwierzę',
      exact: true,
    }).click()

    const formHeading = page.getByRole('heading', {
      name: 'Dodaj zwierzę',
      exact: true,
    })

    await expect(formHeading).toBeVisible()

    await page.getByRole('combobox', {
      name: 'Właściciel',
      exact: true,
    }).selectOption({ label: 'E2E Odczyt' })

    await page.getByLabel('Imię', { exact: true }).fill(name)

    await page.getByRole('combobox', {
      name: 'Gatunek',
      exact: true,
    }).selectOption('dog')

    await page.getByLabel('Rasa', { exact: true }).fill(breed)
    await page.getByLabel('Data urodzenia', {
      exact: true,
    }).fill(birthDate)
    await page.getByLabel('Numer chipa', {
      exact: true,
    }).fill(chipNumber)
    await page.locator('textarea[name="notes"]').fill(notes)

    await page.getByRole('button', {
      name: 'Zapisz zwierzę',
      exact: true,
    }).click()

    await expect(formHeading).toHaveCount(0)

    const search = page.getByRole('searchbox', {
      name: 'Szukaj zwierząt',
      exact: true,
    })

    async function searchForAnimal() {
      const responsePromise = page.waitForResponse((response) => {
        const url = new URL(response.url())

        return (
          response.request().method() === 'GET' &&
          url.pathname === '/api/animals/' &&
          url.searchParams.get('search') === name
        )
      })

      await search.fill(name)

      expect((await responsePromise).status()).toBe(200)
    }

    await searchForAnimal()

    const animalRow = page.getByRole('row').filter({
      has: page.getByRole('cell', {
        name,
        exact: true,
      }),
    })

    await expect(animalRow).toHaveCount(1)

    await page.reload()
    await searchForAnimal()

    await expect(animalRow).toHaveCount(1)

    for (const value of [
      name,
      'Pies',
      breed,
      birthDate,
      chipNumber,
      'E2E Odczyt',
    ]) {
      await expect(animalRow.getByRole('cell', {
        name: value,
        exact: true,
      })).toBeVisible()
    }

    await animalRow.getByRole('button', {
      name: 'Edytuj',
      exact: true,
    }).click()

    await expect(page.getByRole('heading', {
      name: 'Edytuj zwierzę',
      exact: true,
    })).toBeVisible()

    await expect(
      page.locator('textarea[name="notes"]'),
    ).toHaveValue(notes)

    await page.getByRole('button', {
      name: 'Anuluj',
      exact: true,
    }).click()
  })
}