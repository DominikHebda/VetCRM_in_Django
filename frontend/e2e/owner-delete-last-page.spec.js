import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

const ownersApiUrl = 'http://127.0.0.1:8002/api/owners/'

for (const [role, username] of [
  ['administrator', 'e2e_admin'],
  ['receptionist', 'e2e_receptionist'],
]) {
  test(`${role} returns to page one after deleting the last owner on page two`, async ({
    page,
    request,
  }) => {
    test.setTimeout(60_000)

    const query = `e2e-last-page-${randomUUID()}`

    /** @type {number[]} */
    const createdIds = []

    /** @type {string[]} */
    const emails = []

    await loginAsUser(page, username)

    const token = await page.evaluate(() =>
      sessionStorage.getItem('vetcrm_access_token'),
    )

    if (!token) {
      throw new Error('Brak tokenu dostępu po zalogowaniu.')
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    }

    try {
      for (let index = 1; index <= 11; index += 1) {
        const number = String(index).padStart(2, '0')
        const email = `${query}-${number}@example.invalid`

        const response = await request.post(ownersApiUrl, {
          headers,
          data: {
            first_name: 'E2E',
            last_name: `ZZZ Ostatnia Strona ${number}`,
            email,
            phone: '500600704',
            address: 'ul. Ostatnia 5, Testowo',
          },
        })

        expect(response.status()).toBe(201)

        const owner = await response.json()

        createdIds.push(owner.id)
        emails.push(email)
      }

      await page.getByRole('link', {
        name: 'Właściciele',
        exact: true,
      }).click()

      const search = page.getByRole('searchbox', {
        name: 'Szukaj właścicieli',
        exact: true,
      })

      const nextButton = page.getByRole('button', {
        name: 'Następna',
        exact: true,
      })

      const previousButton = page.getByRole('button', {
        name: 'Poprzednia',
        exact: true,
      })

      /**
       * @param {number} pageNumber
       */
      function waitForOwners(pageNumber) {
        return page.waitForResponse((response) => {
          const url = new URL(response.url())

          return (
            response.request().method() === 'GET' &&
            url.pathname === '/api/owners/' &&
            url.searchParams.get('search') === query &&
            Number(url.searchParams.get('page') ?? '1') === pageNumber
          )
        })
      }

      async function checkRemainingOwners() {
        await expect(page.getByText('Strona 1', {
          exact: true,
        })).toBeVisible()

        const rows = page.getByRole('table').locator('tbody tr')

        await expect(rows).toHaveCount(10)

        await expect(
          rows.locator('td:nth-child(2)'),
        ).toHaveText(emails.slice(0, 10))

        await expect(previousButton).toBeDisabled()
        await expect(nextButton).toBeDisabled()

        await expect(
          page.locator('.page-summary strong'),
        ).toHaveText('10')
      }

      const firstPageResponse = waitForOwners(1)

      await search.fill(query)

      expect((await firstPageResponse).status()).toBe(200)

      await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(10)
      await expect(nextButton).toBeEnabled()

      const secondPageResponse = waitForOwners(2)

      await nextButton.click()

      expect((await secondPageResponse).status()).toBe(200)

      await expect(page.getByText('Strona 2', {
        exact: true,
      })).toBeVisible()

      await expect(page.getByRole('table').locator('tbody tr')).toHaveCount(1)
      await expect(previousButton).toBeEnabled()
      await expect(nextButton).toBeDisabled()

      const lastOwnerRow = page.getByRole('row').filter({
        has: page.getByRole('cell', {
          name: emails[10],
          exact: true,
        }),
      })

      await expect(lastOwnerRow).toHaveCount(1)

      const deletedOwnerId = createdIds[10]

      const deleteResponse = page.waitForResponse((response) => {
        const url = new URL(response.url())

        return (
          response.request().method() === 'DELETE' &&
          url.pathname === `/api/owners/${deletedOwnerId}/`
        )
      })

      const returnResponse = waitForOwners(1)

      page.once('dialog', (dialog) => dialog.accept())

      await lastOwnerRow.getByRole('button', {
        name: 'Usuń',
        exact: true,
      }).click()

      expect((await deleteResponse).status()).toBe(204)
      expect((await returnResponse).status()).toBe(200)

      await checkRemainingOwners()
      await expect(lastOwnerRow).toHaveCount(0)

      await page.reload()

      const reloadResponse = waitForOwners(1)

      await search.fill(query)

      expect((await reloadResponse).status()).toBe(200)

      await checkRemainingOwners()
      await expect(lastOwnerRow).toHaveCount(0)
    } finally {
      for (const ownerId of createdIds) {
        const response = await request.delete(
          `${ownersApiUrl}${ownerId}/`,
          { headers },
        )

        expect([204, 404]).toContain(response.status())
      }
    }
  })
}