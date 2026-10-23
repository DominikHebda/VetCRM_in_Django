import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

test.use({ timezoneId: 'UTC' })

for (const [role, username] of [
  ['administrator', 'e2e_admin'],
  ['veterinarian', 'e2e_vet'],
  ['receptionist', 'e2e_receptionist'],
]) {
  test(`${role} creates a visit and sees saved data after reload`, async ({
    page,
  }) => {
    const reason = `Kontrola E2E ${randomUUID()}`
    const visitDate = '2027-01-15T10:30'
    const notes = 'Notatka wizyty zapisana przez test E2E.'

    await loginAsUser(page, username)

    await page.getByRole('link', {
      name: 'Wizyty',
      exact: true,
    }).click()

    await expect(page.getByRole('heading', {
      name: 'Wizyty',
      exact: true,
    })).toBeVisible()

    await page.getByRole('button', {
      name: 'Dodaj wizytę',
      exact: true,
    }).click()

    const formHeading = page.getByRole('heading', {
      name: 'Dodaj wizytę',
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

    await page.getByLabel('Data i godzina', {
      exact: true,
    }).fill(visitDate)

    await page.getByRole('combobox', {
      name: 'Status',
      exact: true,
    }).selectOption('SCHEDULED')

    await page.getByLabel('Powód wizyty', {
      exact: true,
    }).fill(reason)

    await page.locator('textarea[name="notes"]').fill(notes)

    const createResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'POST' &&
        url.pathname === '/api/visits/'
      )
    })

    await page.getByRole('button', {
      name: 'Zapisz wizytę',
      exact: true,
    }).click()

    expect((await createResponse).status()).toBe(201)
    await expect(formHeading).toHaveCount(0)

    const search = page.getByRole('searchbox', {
      name: 'Szukaj wizyt',
      exact: true,
    })

    async function searchForVisit() {
      const responsePromise = page.waitForResponse((response) => {
        const url = new URL(response.url())

        return (
          response.request().method() === 'GET' &&
          url.pathname === '/api/visits/' &&
          url.searchParams.get('search') === reason
        )
      })

      await search.fill(reason)

      expect((await responsePromise).status()).toBe(200)
    }

    await searchForVisit()

    const visitRow = page.getByRole('row').filter({
      has: page.getByRole('cell', {
        name: reason,
        exact: true,
      }),
    })

    await expect(visitRow).toHaveCount(1)

    await page.reload()
    await searchForVisit()

    await expect(visitRow).toHaveCount(1)

    await expect(visitRow.getByText('E2E Pacjent Odczyt', {
      exact: true,
    })).toBeVisible()

    await expect(visitRow.getByText('pies · E2E Odczyt', {
      exact: true,
    })).toBeVisible()

    await expect(visitRow.getByRole('cell', {
      name: 'E2E VET',
      exact: true,
    })).toBeVisible()

    await expect(visitRow.getByRole('cell', {
      name: 'Zaplanowana',
      exact: true,
    })).toBeVisible()

    await visitRow.getByRole('button', {
      name: 'Edytuj',
      exact: true,
    }).click()

    await expect(page.getByRole('heading', {
      name: 'Edytuj wizytę',
      exact: true,
    })).toBeVisible()

    await expect(animalSelect).toHaveValue(animalId)
    await expect(veterinarianSelect).toHaveValue(veterinarianId)

    await expect(page.getByLabel('Data i godzina', {
      exact: true,
    })).toHaveValue(visitDate)

    await expect(page.getByRole('combobox', {
      name: 'Status',
      exact: true,
    })).toHaveValue('SCHEDULED')

    await expect(page.getByLabel('Powód wizyty', {
      exact: true,
    })).toHaveValue(reason)

    await expect(
      page.locator('textarea[name="notes"]'),
    ).toHaveValue(notes)

    await page.getByRole('button', {
      name: 'Anuluj',
      exact: true,
    }).click()
  })
}