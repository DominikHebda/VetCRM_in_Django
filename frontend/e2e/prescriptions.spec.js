import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

for (const [role, username, issuerName] of [
  ['administrator', 'e2e_admin', 'E2E ADMIN'],
  ['veterinarian', 'e2e_vet', 'E2E VET'],
]) {
  test(`${role} creates, updates and deletes a prescription`, async ({
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

    /**
     * @param {string} query
     */
    async function searchForPrescription(query) {
      const responsePromise = page.waitForResponse((response) => {
        const url = new URL(response.url())

        return (
          response.request().method() === 'GET' &&
          url.pathname === '/api/prescriptions/' &&
          url.searchParams.get('search') === query
        )
      })

      await page.getByRole('searchbox', {
        name: 'Szukaj recept',
        exact: true,
      }).fill(query)

      expect((await responsePromise).status()).toBe(200)
    }

    await searchForPrescription(medicationName)

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

    const updatedName = `Zmiana leku E2E ${randomUUID()}`
    const updatedInstructions = 'Zmienione zalecenia recepty E2E.'

    const updatedFields = [
      ['Nazwa leku', updatedName],
      ['Substancja czynna', 'Zmieniona substancja E2E'],
      ['Dawkowanie', '2 tabletki'],
      ['Częstotliwość', 'Dwa razy dziennie'],
      ['Czas stosowania', '10 dni'],
      ['Ilość', '20'],
      ['Data wystawienia', '2026-09-16'],
      ['Ważna do', '2026-10-16'],
    ]

    for (const [label, value] of updatedFields) {
      await page.getByLabel(label, {
        exact: true,
      }).fill(value)
    }

    await page.locator('textarea[name="instructions"]').fill(
      updatedInstructions,
    )

    const prescriptionPath =
      `/api/prescriptions/${savedPrescription.id}/`

    const updateResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'PATCH' &&
        url.pathname === prescriptionPath
      )
    })

    await page.getByRole('button', {
      name: 'Zapisz zmiany',
      exact: true,
    }).click()

    const updatedResponse = await updateResponse
    expect(updatedResponse.status()).toBe(200)

    const updatedPrescription = await updatedResponse.json()

    expect(updatedPrescription.id).toBe(savedPrescription.id)
    expect(updatedPrescription.prescription_number).toBe(
      savedPrescription.prescription_number,
    )
    expect(updatedPrescription.veterinarian).toBe(
      savedPrescription.veterinarian,
    )
    expect(updatedPrescription.animal).toBe(Number(animalId))
    expect(updatedPrescription.visit).toBe(Number(visitId))

    await expect(page.getByRole('heading', {
      name: 'Edytuj receptę',
      exact: true,
    })).toHaveCount(0)

    await searchForPrescription(updatedName)

    const editedRow = page.getByRole('row').filter({
      has: page.getByText(updatedName, {
        exact: true,
      }),
    })

    await expect(editedRow).toHaveCount(1)

    await page.reload()
    await searchForPrescription(updatedName)

    await expect(editedRow).toHaveCount(1)

    for (const value of [
      'Zmieniona substancja E2E',
      '2 tabletki',
      'Dwa razy dziennie',
    ]) {
      await expect(editedRow.getByText(value, {
        exact: true,
      })).toBeVisible()
    }

    for (const value of [
      savedPrescription.prescription_number,
      '2026-09-16',
      '2026-10-16',
      issuerName,
    ]) {
      await expect(editedRow.getByRole('cell', {
        name: value,
        exact: true,
      })).toBeVisible()
    }

    await editedRow.getByRole('button', {
      name: 'Edytuj',
      exact: true,
    }).click()

    await expect(page.getByRole('heading', {
      name: 'Edytuj receptę',
      exact: true,
    })).toBeVisible()

    await expect(animalSelect).toHaveValue(animalId)
    await expect(visitSelect).toHaveValue(visitId)

    for (const [label, value] of updatedFields) {
      await expect(page.getByLabel(label, {
        exact: true,
      })).toHaveValue(value)
    }

    await expect(
      page.locator('textarea[name="instructions"]'),
    ).toHaveValue(updatedInstructions)

    await page.getByRole('button', {
      name: 'Anuluj',
      exact: true,
    }).click()

    const deleteResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'DELETE' &&
        url.pathname === prescriptionPath
      )
    })

    page.once('dialog', (dialog) => dialog.accept())

    await editedRow.getByRole('button', {
      name: 'Usuń',
      exact: true,
    }).click()

    expect((await deleteResponse).status()).toBe(204)

    await expect(page.getByRole('heading', {
      name: 'Brak zapisanych recept',
      exact: true,
    })).toBeVisible()

    await expect(editedRow).toHaveCount(0)

    await page.reload()
    await searchForPrescription(updatedName)

    await expect(page.getByRole('heading', {
      name: 'Brak zapisanych recept',
      exact: true,
    })).toBeVisible()

    await expect(editedRow).toHaveCount(0)
  })
}