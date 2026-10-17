import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

for (const [role, username] of [
  ['administrator', 'e2e_admin'],
  ['receptionist', 'e2e_receptionist'],
]) {
    test(`${role} creates, updates and deletes an owner`, async ({
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
    await page.locator('textarea[name="address"]').fill(address)

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

    const ownerIdText = await ownerRow.getByText(/^ID: \d+$/).innerText()
    const updatedEmail = `e2e-updated-${randomUUID()}@example.com`
    const updatedPhone = '600700800'
    const updatedAddress = 'ul. Zmieniona 2, 00-002 Testowo'

    await ownerRow.getByRole('button', {
      name: 'Edytuj',
      exact: true,
    }).click()

    const editHeading = page.getByRole('heading', {
      name: 'Edytuj właściciela',
      exact: true,
    })

    await expect(editHeading).toBeVisible()

    await page.getByLabel('Imię', { exact: true }).fill('Edycja')
    await page.getByLabel('Nazwisko', { exact: true }).fill('Zmieniony')
    await page.getByLabel('E-mail', { exact: true }).fill(updatedEmail)
    await page.getByLabel('Telefon', { exact: true }).fill(updatedPhone)
    await expect(page.locator('textarea[name="address"]')).toHaveValue(address)
    await page.locator('textarea[name="address"]').fill(updatedAddress)

    await page.getByRole('button', {
      name: 'Zapisz właściciela',
      exact: true,
    }).click()

    await expect(editHeading).toHaveCount(0)
    await search.fill(updatedEmail)

    const editedRow = page.getByRole('row').filter({
      has: page.getByRole('cell', {
        name: updatedEmail,
        exact: true,
      }),
    })

    await expect(editedRow).toHaveCount(1)

    await page.reload()
    await search.fill(updatedEmail)

    await expect(editedRow).toHaveCount(1)
    await expect(editedRow.getByText(ownerIdText, {
      exact: true,
    })).toBeVisible()
    await expect(editedRow.getByText('Edycja Zmieniony', {
      exact: true,
    })).toBeVisible()
    await expect(editedRow.getByRole('cell', {
      name: updatedPhone,
      exact: true,
    })).toBeVisible()
    await expect(editedRow.getByRole('cell', {
      name: updatedAddress,
      exact: true,
    })).toBeVisible()

    page.once('dialog', (dialog) => dialog.accept())

    await editedRow.getByRole('button', {
      name: 'Usuń',
      exact: true,
    }).click()

    await expect(editedRow).toHaveCount(0)
    await expect(page.getByRole('heading', {
      name: 'Brak właścicieli',
      exact: true,
    })).toBeVisible()

    await page.reload()
    await search.fill(updatedEmail)

    await expect(page.getByRole('heading', {
      name: 'Brak właścicieli',
      exact: true,
    })).toBeVisible()
    await expect(editedRow).toHaveCount(0)
  })
}

test('veterinarian can read owners without management actions', async ({
  page,
}) => {
  const email = 'e2e-readonly@example.invalid'

  await loginAsUser(page, 'e2e_vet')

  await page.getByRole('link', {
    name: 'Właściciele',
    exact: true,
  }).click()

  await expect(page.getByRole('heading', {
    name: 'Właściciele',
    exact: true,
  })).toBeVisible()

  const filteredResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())

    return (
      response.request().method() === 'GET' &&
      url.pathname === '/api/owners/' &&
      url.searchParams.get('search') === email
    )
  })

  await page.getByRole('searchbox', {
    name: 'Szukaj właścicieli',
    exact: true,
  }).fill(email)

  expect((await filteredResponse).status()).toBe(200)

  const ownerRow = page.getByRole('row').filter({
    has: page.getByRole('cell', {
      name: email,
      exact: true,
    }),
  })

  await expect(ownerRow).toHaveCount(1)

  await expect(ownerRow.getByText('E2E Odczyt', {
    exact: true,
  })).toBeVisible()

  await expect(ownerRow.getByRole('cell', {
    name: '500600701',
    exact: true,
  })).toBeVisible()

  await expect(ownerRow.getByRole('cell', {
    name: 'ul. Odczytowa 1, Testowo',
    exact: true,
  })).toBeVisible()

  await expect(page.getByRole('button', {
    name: 'Dodaj właściciela',
    exact: true,
  })).toHaveCount(0)

  await expect(ownerRow.getByRole('button', {
    name: 'Edytuj',
    exact: true,
  })).toHaveCount(0)

  await expect(ownerRow.getByRole('button', {
    name: 'Usuń',
    exact: true,
  })).toHaveCount(0)

  await expect(page.getByRole('columnheader', {
    name: 'Akcje',
    exact: true,
  })).toHaveCount(0)
})
