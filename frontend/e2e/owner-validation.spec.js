import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

for (const [role, username] of [
  ['administrator', 'e2e_admin'],
  ['receptionist', 'e2e_receptionist'],
]) {
  test(`${role} corrects rejected owner data without losing form values`, async ({
    page,
  }) => {
    const email = `e2e-validation-${randomUUID()}@example.invalid`
    const phone = '500600702'
    const address = 'ul. Walidacyjna 3, Testowo'

    await loginAsUser(page, username)

    await page.getByRole('link', {
      name: 'Właściciele',
      exact: true,
    }).click()

    await page.getByRole('button', {
      name: 'Dodaj właściciela',
      exact: true,
    }).click()

    const formHeading = page.getByRole('heading', {
      name: 'Nowy właściciel',
      exact: true,
    })

    await expect(formHeading).toBeVisible()

    const firstNameInput = page.getByLabel('Imię', {
      exact: true,
    })
    const lastNameInput = page.getByLabel('Nazwisko', {
      exact: true,
    })
    const emailInput = page.getByLabel('E-mail', {
      exact: true,
    })
    const phoneInput = page.getByLabel('Telefon', {
      exact: true,
    })
    const addressInput = page.locator('textarea[name="address"]')

    await firstNameInput.fill('   ')
    await lastNameInput.fill('Walidacja')
    await emailInput.fill(email)
    await phoneInput.fill(phone)
    await addressInput.fill(address)

    const saveButton = page.getByRole('button', {
      name: 'Zapisz właściciela',
      exact: true,
    })

    function waitForCreateResponse() {
      return page.waitForResponse((response) => {
        const url = new URL(response.url())

        return (
          response.request().method() === 'POST' &&
          url.pathname === '/api/owners/'
        )
      })
    }

    const rejectedResponsePromise = waitForCreateResponse()

    await saveButton.click()

    const rejectedResponse = await rejectedResponsePromise

    expect(rejectedResponse.status()).toBe(400)
    expect(await rejectedResponse.json()).toHaveProperty('first_name')

    const errorMessage = page.getByText(
      'Nie udało się zapisać właściciela. Sprawdź dane i spróbuj ponownie.',
      { exact: true },
    )

    await expect(errorMessage).toBeVisible()
    await expect(formHeading).toBeVisible()
    await expect(saveButton).toBeEnabled()

    await expect(firstNameInput).toHaveValue('   ')
    await expect(lastNameInput).toHaveValue('Walidacja')
    await expect(emailInput).toHaveValue(email)
    await expect(phoneInput).toHaveValue(phone)
    await expect(addressInput).toHaveValue(address)

    await firstNameInput.fill('E2E')

    const savedResponsePromise = waitForCreateResponse()

    await saveButton.click()

    const savedResponse = await savedResponsePromise

    expect(savedResponse.status()).toBe(201)

    const savedOwner = await savedResponse.json()

    expect(savedOwner).toMatchObject({
      first_name: 'E2E',
      last_name: 'Walidacja',
      email,
      phone,
      address,
    })

    await expect(formHeading).toHaveCount(0)
    await expect(errorMessage).toHaveCount(0)

    await page.reload()

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

    await expect(ownerRow.getByText('E2E Walidacja', {
      exact: true,
    })).toBeVisible()

    for (const value of [email, phone, address]) {
      await expect(ownerRow.getByRole('cell', {
        name: value,
        exact: true,
      })).toBeVisible()
    }
  })
}