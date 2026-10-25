import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

for (const [role, username, issuerName] of [
  ['administrator', 'e2e_admin', 'E2E ADMIN'],
  ['veterinarian', 'e2e_vet', 'E2E VET'],
]) {
  test(`${role} creates a prescription and sees saved data after reload`, async ({
    page,
  }) => {
    const medicationName = `Lek E2E ${randomUUID()}`
    const instructions = 'Zalecenia zapisane przez test recept E2E.'

    const fields = [
      ['Nazwa leku', medicationName],
      ['Substancja czynna', 'Substancja testowa E2E'],
      ['Dawkowanie', '1 tabletka'],
      ['Częstotliwość', 'Raz dziennie'],
      ['Czas stosowania', '7 dni'],
      ['Ilość', '7'],
      ['Data wystawienia', '2026-09-15'],
      ['Ważna do', '2026-10-15'],
    ]

    await loginAsUser(page, username)

    await page.getByRole('link', {
      name: 'Recepty',
      exact: true,
    }).click()

    await expect(page.getByRole('heading', {
      name: 'Recepty',
      exact: true,
    })).toBeVisible()

    await page.getByRole('button', {
      name: 'Dodaj receptę',
      exact: true,
    }).click()

    const formHeading = page.getByRole('heading', {
      name: 'Dodaj receptę',
      exact: true,
    })

    await expect(formHeading).toBeVisible()

    const animalSelect = page.getByRole('combobox', {
      name: 'Pacjent',
      exact: true,
    })

    const visitSelect = page.getByRole('combobox', {
      name: 'Wizyta',
      exact: true,
    })

    await expect(visitSelect).toBeDisabled()

    await animalSelect.selectOption({
      label: 'E2E Pacjent Odczyt — pies — E2E Odczyt',
    })

    const animalId = await animalSelect.inputValue()

    await expect(visitSelect).toBeEnabled()

    const visitOption = visitSelect.getByRole('option', {
      name: /E2E wizyta do odczytu dokumentacji/,
    })

    await expect(visitOption).toHaveCount(1)

    const visitId = await visitOption.getAttribute('value')

    if (!visitId) {
      throw new Error('Brak identyfikatora wizyty E2E.')
    }

    await visitSelect.selectOption(visitId)

    for (const [label, value] of fields) {
      await page.getByLabel(label, {
        exact: true,
      }).fill(value)
    }

    await page.locator('textarea[name="instructions"]').fill(
      instructions,
    )

    const createResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'POST' &&
        url.pathname === '/api/prescriptions/'
      )
    })

    await page.getByRole('button', {
      name: 'Zapisz receptę',
      exact: true,
    }).click()

    const savedResponse = await createResponse
    expect(savedResponse.status()).toBe(201)

    const savedPrescription = await savedResponse.json()
    expect(savedPrescription.animal).toBe(Number(animalId))
    expect(savedPrescription.visit).toBe(Number(visitId))
    expect(savedPrescription.veterinarian_name).toBe(issuerName)
    expect(savedPrescription.prescription_number).toBeTruthy()

    await expect(formHeading).toHaveCount(0)

    await page.reload()

    const filteredResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'GET' &&
        url.pathname === '/api/prescriptions/' &&
        url.searchParams.get('search') === medicationName
      )
    })

    await page.getByRole('searchbox', {
      name: 'Szukaj recept',
      exact: true,
    }).fill(medicationName)

    expect((await filteredResponse).status()).toBe(200)

    const prescriptionRow = page.getByRole('row').filter({
      has: page.getByText(medicationName, {
        exact: true,
      }),
    })

    await expect(prescriptionRow).toHaveCount(1)

    for (const value of [
      'E2E Pacjent Odczyt',
      'E2E Odczyt',
      medicationName,
      'Substancja testowa E2E',
      '1 tabletka',
      'Raz dziennie',
    ]) {
      await expect(prescriptionRow.getByText(value, {
        exact: true,
      })).toBeVisible()
    }

    for (const value of [
      savedPrescription.prescription_number,
      '2026-09-15',
      '2026-10-15',
      issuerName,
    ]) {
      await expect(prescriptionRow.getByRole('cell', {
        name: value,
        exact: true,
      })).toBeVisible()
    }

    await prescriptionRow.getByRole('button', {
      name: 'Edytuj',
      exact: true,
    }).click()

    await expect(page.getByRole('heading', {
      name: 'Edytuj receptę',
      exact: true,
    })).toBeVisible()

    await expect(animalSelect).toHaveValue(animalId)
    await expect(visitSelect).toHaveValue(visitId)

    for (const [label, value] of fields) {
      await expect(page.getByLabel(label, {
        exact: true,
      })).toHaveValue(value)
    }

    await expect(
      page.locator('textarea[name="instructions"]'),
    ).toHaveValue(instructions)

    await page.getByRole('button', {
      name: 'Anuluj',
      exact: true,
    }).click()
  })
}