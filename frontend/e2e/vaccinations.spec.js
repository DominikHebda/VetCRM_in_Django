import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

for (const [role, username] of [
  ['administrator', 'e2e_admin'],
  ['veterinarian', 'e2e_vet'],
]) {
  test(`${role} creates a vaccination and sees saved data after reload`, async ({
    page,
  }) => {
    const vaccineName = `Szczepionka E2E ${randomUUID()}`
    const manufacturer = 'Producent E2E'
    const batchNumber = `SERIA-${randomUUID()}`
    const vaccinationDate = '2026-09-15'
    const nextDueDate = '2027-09-15'
    const notes = 'Uwagi zapisane przez test szczepień E2E.'

    await loginAsUser(page, username)

    await page.getByRole('link', {
      name: 'Szczepienia',
      exact: true,
    }).click()

    await expect(page.getByRole('heading', {
      name: 'Szczepienia',
      exact: true,
    })).toBeVisible()

    await page.getByRole('button', {
      name: 'Dodaj szczepienie',
      exact: true,
    }).click()

    const formHeading = page.getByRole('heading', {
      name: 'Dodaj szczepienie',
      exact: true,
    })

    await expect(formHeading).toBeVisible()

    const animalSelect = page.getByRole('combobox', {
      name: 'Pacjent',
      exact: true,
    })

    await animalSelect.selectOption({
      label: 'E2E Pacjent Odczyt — pies — E2E Odczyt',
    })

    const animalId = await animalSelect.inputValue()

    const veterinarianSelect = page.getByRole('combobox', {
      name: 'Weterynarz',
      exact: true,
    })

    await veterinarianSelect.selectOption({
      label: 'E2E VET',
    })

    const veterinarianId = await veterinarianSelect.inputValue()

    await page.getByLabel('Nazwa szczepionki', {
      exact: true,
    }).fill(vaccineName)

    await page.getByLabel('Producent', {
      exact: true,
    }).fill(manufacturer)

    await page.getByLabel('Numer serii', {
      exact: true,
    }).fill(batchNumber)

    await page.getByLabel('Data szczepienia', {
      exact: true,
    }).fill(vaccinationDate)

    await page.getByLabel('Termin kolejnej dawki', {
      exact: true,
    }).fill(nextDueDate)

    await page.locator('textarea[name="notes"]').fill(notes)

    const createResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'POST' &&
        url.pathname === '/api/vaccinations/'
      )
    })

    await page.getByRole('button', {
      name: 'Zapisz szczepienie',
      exact: true,
    }).click()

    expect((await createResponse).status()).toBe(201)
    await expect(formHeading).toHaveCount(0)

    await page.reload()

    const filteredResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'GET' &&
        url.pathname === '/api/vaccinations/' &&
        url.searchParams.get('search') === vaccineName
      )
    })

    await page.getByRole('searchbox', {
      name: 'Szukaj szczepień',
      exact: true,
    }).fill(vaccineName)

    expect((await filteredResponse).status()).toBe(200)

    const vaccinationRow = page.getByRole('row').filter({
      has: page.getByText(vaccineName, {
        exact: true,
      }),
    })

    await expect(vaccinationRow).toHaveCount(1)

    for (const value of [
      'E2E Pacjent Odczyt',
      'E2E Odczyt',
      vaccineName,
      manufacturer,
    ]) {
      await expect(vaccinationRow.getByText(value, {
        exact: true,
      })).toBeVisible()
    }

    for (const value of [
      vaccinationDate,
      nextDueDate,
      'E2E VET',
    ]) {
      await expect(vaccinationRow.getByRole('cell', {
        name: value,
        exact: true,
      })).toBeVisible()
    }

    await vaccinationRow.getByRole('button', {
      name: 'Edytuj',
      exact: true,
    }).click()

    await expect(page.getByRole('heading', {
      name: 'Edytuj szczepienie',
      exact: true,
    })).toBeVisible()

    await expect(animalSelect).toHaveValue(animalId)
    await expect(veterinarianSelect).toHaveValue(veterinarianId)

    await expect(page.getByLabel('Nazwa szczepionki', {
      exact: true,
    })).toHaveValue(vaccineName)

    await expect(page.getByLabel('Producent', {
      exact: true,
    })).toHaveValue(manufacturer)

    await expect(page.getByLabel('Numer serii', {
      exact: true,
    })).toHaveValue(batchNumber)

    await expect(page.getByLabel('Data szczepienia', {
      exact: true,
    })).toHaveValue(vaccinationDate)

    await expect(page.getByLabel('Termin kolejnej dawki', {
      exact: true,
    })).toHaveValue(nextDueDate)

    await expect(
      page.locator('textarea[name="notes"]'),
    ).toHaveValue(notes)

    await page.getByRole('button', {
      name: 'Anuluj',
      exact: true,
    }).click()
  })
}