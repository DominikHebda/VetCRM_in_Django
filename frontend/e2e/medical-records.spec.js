import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

test.use({ timezoneId: 'Europe/Warsaw' })

for (const [role, username] of [
  ['administrator', 'e2e_admin'],
  ['veterinarian', 'e2e_vet'],
]) {
  test(`${role} creates, updates and deletes a medical record`, async ({
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

    /**
     * @param {string} query
     */
    async function searchForRecord(query) {
      const responsePromise = page.waitForResponse((response) => {
        const url = new URL(response.url())

        return (
          response.request().method() === 'GET' &&
          url.pathname === '/api/medical-records/' &&
          url.searchParams.get('search') === query
        )
      })

      await page.getByRole('searchbox', {
        name: 'Szukaj dokumentacji medycznej',
        exact: true,
      }).fill(query)

      expect((await responsePromise).status()).toBe(200)
    }

    await searchForRecord(diagnosis)

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

    const updatedDiagnosis = `Zmiana diagnozy E2E ${randomUUID()}`
    const updatedTreatment = 'Zmienione leczenie E2E.'
    const updatedRecommendations = 'Kontrola za dwa tygodnie.'

    await page.locator('textarea[name="diagnosis"]').fill(
      updatedDiagnosis,
    )
    await page.locator('textarea[name="treatment"]').fill(
      updatedTreatment,
    )
    await page.locator('textarea[name="recommendations"]').fill(
      updatedRecommendations,
    )

    await page.getByLabel('Waga (kg)', {
      exact: true,
    }).fill('13.25')

    await page.getByLabel('Temperatura (°C)', {
      exact: true,
    }).fill('38.7')

    const recordPath = `/api/medical-records/${savedRecord.id}/`

    const updateResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'PUT' &&
        url.pathname === recordPath
      )
    })

    await page.getByRole('button', {
      name: 'Zapisz dokumentację',
      exact: true,
    }).click()

    const updatedResponse = await updateResponse
    expect(updatedResponse.status()).toBe(200)

    const updatedRecord = await updatedResponse.json()
    expect(updatedRecord.id).toBe(savedRecord.id)
    expect(updatedRecord.visit).toBe(createdVisit.id)

    await expect(page.getByRole('heading', {
      name: 'Edytuj dokumentację medyczną',
      exact: true,
    })).toHaveCount(0)

    await searchForRecord(updatedDiagnosis)

    const editedRow = page.getByRole('row').filter({
      has: page.getByRole('cell', {
        name: updatedDiagnosis,
        exact: true,
      }),
    })

    await expect(editedRow).toHaveCount(1)

    await page.reload()
    await searchForRecord(updatedDiagnosis)

    await expect(editedRow).toHaveCount(1)

    await expect(editedRow.getByRole('cell', {
      name: updatedTreatment,
      exact: true,
    })).toBeVisible()

    await editedRow.getByRole('button', {
      name: 'Edytuj',
      exact: true,
    }).click()

    await expect(page.getByRole('heading', {
      name: 'Edytuj dokumentację medyczną',
      exact: true,
    })).toBeVisible()

    await expect(visitSelect).toHaveValue(String(createdVisit.id))

    await expect(
      page.locator('textarea[name="diagnosis"]'),
    ).toHaveValue(updatedDiagnosis)

    await expect(
      page.locator('textarea[name="treatment"]'),
    ).toHaveValue(updatedTreatment)

    await expect(
      page.locator('textarea[name="recommendations"]'),
    ).toHaveValue(updatedRecommendations)

    await expect(page.getByLabel('Waga (kg)', {
      exact: true,
    })).toHaveValue('13.25')

    await expect(page.getByLabel('Temperatura (°C)', {
      exact: true,
    })).toHaveValue('38.7')

    await page.getByRole('button', {
      name: 'Anuluj',
      exact: true,
    }).click()

    const deleteResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'DELETE' &&
        url.pathname === recordPath
      )
    })

    page.once('dialog', (dialog) => dialog.accept())

    await editedRow.getByRole('button', {
      name: 'Usuń',
      exact: true,
    }).click()

    expect((await deleteResponse).status()).toBe(204)

    await expect(page.getByRole('heading', {
      name: 'Brak dokumentacji medycznej',
      exact: true,
    })).toBeVisible()

    await expect(editedRow).toHaveCount(0)

    await page.reload()
    await searchForRecord(updatedDiagnosis)

    await expect(page.getByRole('heading', {
      name: 'Brak dokumentacji medycznej',
      exact: true,
    })).toBeVisible()

    await expect(editedRow).toHaveCount(0)

    await page.getByRole('button', {
      name: 'Dodaj dokumentację',
      exact: true,
    }).click()

    await expect(formHeading).toBeVisible()

    await visitSelect.selectOption(String(createdVisit.id))
    await expect(visitSelect).toHaveValue(String(createdVisit.id))

    await page.getByRole('button', {
      name: 'Anuluj',
      exact: true,
    }).click()
  })
}

test('receptionist can read medical records without management actions', async ({
  page,
}) => {
  const diagnosis = 'E2E Diagnoza Odczyt'

  await loginAsUser(page, 'e2e_receptionist')

  await page.getByRole('link', {
    name: 'Dokumentacja medyczna',
    exact: true,
  }).click()

  await expect(page.getByRole('heading', {
    name: 'Dokumentacja medyczna',
    exact: true,
  })).toBeVisible()

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

  await expect(recordRow.getByText('pies · E2E Odczyt', {
    exact: true,
  })).toBeVisible()

  for (const value of [
    'E2E Leczenie Odczyt',
    '12.50 kg',
    '38.5 °C',
  ]) {
    await expect(recordRow.getByRole('cell', {
      name: value,
      exact: true,
    })).toBeVisible()
  }

  await expect(page.getByRole('button', {
    name: 'Dodaj dokumentację',
    exact: true,
  })).toHaveCount(0)

  await expect(recordRow.getByRole('button', {
    name: 'Edytuj',
    exact: true,
  })).toHaveCount(0)

  await expect(recordRow.getByRole('button', {
    name: 'Usuń',
    exact: true,
  })).toHaveCount(0)

  await expect(page.getByRole('columnheader', {
    name: 'Akcje',
    exact: true,
  })).toHaveCount(0)
})
