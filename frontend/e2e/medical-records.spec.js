import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

test.use({ timezoneId: 'Europe/Warsaw' })

for (const [role, username] of [
  ['administrator', 'e2e_admin'],
  ['veterinarian', 'e2e_vet'],
]) {
  test(`${role} creates a medical record and sees saved data after reload`, async ({
    page,
  }) => {
    const reason = `Dokumentacja E2E ${randomUUID()}`
    const diagnosis = `Diagnoza E2E ${randomUUID()}`
    const treatment = 'Leczenie zapisane przez test E2E.'
    const recommendations = 'Kontrola za tydzień.'

    await loginAsUser(page, username)

    await page.getByRole('link', {
      name: 'Wizyty',
      exact: true,
    }).click()

    await page.getByRole('button', {
      name: 'Dodaj wizytę',
      exact: true,
    }).click()

    await expect(page.getByRole('heading', {
      name: 'Dodaj wizytę',
      exact: true,
    })).toBeVisible()

    await page.getByRole('combobox', {
      name: 'Pacjent',
      exact: true,
    }).selectOption({
      label: 'E2E Pacjent Odczyt — pies — E2E Odczyt',
    })

    await page.getByRole('combobox', {
      name: 'Weterynarz',
      exact: true,
    }).selectOption({ label: 'E2E VET' })

    await page.getByLabel('Data i godzina', {
      exact: true,
    }).fill('2027-01-15T10:30')

    await page.getByLabel('Powód wizyty', {
      exact: true,
    }).fill(reason)

    const visitResponse = page.waitForResponse((response) => {
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

    const createdVisitResponse = await visitResponse
    expect(createdVisitResponse.status()).toBe(201)
    const createdVisit = await createdVisitResponse.json()

    await expect(page.getByRole('heading', {
      name: 'Dodaj wizytę',
      exact: true,
    })).toHaveCount(0)

    await page.getByRole('link', {
      name: 'Dokumentacja medyczna',
      exact: true,
    }).click()

    await page.getByRole('button', {
      name: 'Dodaj dokumentację',
      exact: true,
    }).click()

    const formHeading = page.getByRole('heading', {
      name: 'Nowa dokumentacja medyczna',
      exact: true,
    })

    await expect(formHeading).toBeVisible()

    const visitSelect = page.getByRole('combobox', {
      name: 'Wizyta',
      exact: true,
    })

    await visitSelect.selectOption(String(createdVisit.id))

    await page.locator('textarea[name="diagnosis"]').fill(diagnosis)
    await page.locator('textarea[name="treatment"]').fill(treatment)
    await page.locator('textarea[name="recommendations"]').fill(
      recommendations,
    )

    await page.getByLabel('Waga (kg)', {
      exact: true,
    }).fill('12.50')

    await page.getByLabel('Temperatura (°C)', {
      exact: true,
    }).fill('38.5')

    const recordResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'POST' &&
        url.pathname === '/api/medical-records/'
      )
    })

    await page.getByRole('button', {
      name: 'Zapisz dokumentację',
      exact: true,
    }).click()

    const savedResponse = await recordResponse
    expect(savedResponse.status()).toBe(201)

    const savedRecord = await savedResponse.json()
    expect(savedRecord.visit).toBe(createdVisit.id)
    expect(Date.parse(savedRecord.visit_date)).toBe(
      Date.parse(createdVisit.visit_date),
    )

    await expect(formHeading).toHaveCount(0)

    await page.reload()

    const filteredResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'GET' &&
        url.pathname === '/api/medical-records/' &&
        url.searchParams.get('search') === diagnosis
      )
    })

    await page.getByRole('searchbox', {
      name: 'Szukaj dokumentacji medycznej',
      exact: true,
    }).fill(diagnosis)

    expect((await filteredResponse).status()).toBe(200)

    const recordRow = page.getByRole('row').filter({
      has: page.getByRole('cell', {
        name: diagnosis,
        exact: true,
      }),
    })

    await expect(recordRow).toHaveCount(1)

    await expect(recordRow.getByText('E2E Pacjent Odczyt', {
      exact: true,
    })).toBeVisible()

    await expect(recordRow.getByRole('cell', {
      name: treatment,
      exact: true,
    })).toBeVisible()

    await recordRow.getByRole('button', {
      name: 'Edytuj',
      exact: true,
    }).click()

    await expect(page.getByRole('heading', {
      name: 'Edytuj dokumentację medyczną',
      exact: true,
    })).toBeVisible()

    await expect(visitSelect).toHaveValue(String(createdVisit.id))
    await expect(
      visitSelect.locator('option:checked'),
    ).toContainText('10:30')

    await expect(
      page.locator('textarea[name="diagnosis"]'),
    ).toHaveValue(diagnosis)

    await expect(
      page.locator('textarea[name="treatment"]'),
    ).toHaveValue(treatment)

    await expect(
      page.locator('textarea[name="recommendations"]'),
    ).toHaveValue(recommendations)

    await expect(page.getByLabel('Waga (kg)', {
      exact: true,
    })).toHaveValue('12.50')

    await expect(page.getByLabel('Temperatura (°C)', {
      exact: true,
    })).toHaveValue('38.5')

    await page.getByRole('button', {
      name: 'Anuluj',
      exact: true,
    }).click()
  })
}