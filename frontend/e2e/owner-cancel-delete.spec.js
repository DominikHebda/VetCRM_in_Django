import { randomUUID } from 'node:crypto'

import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

const ownersApiUrl = 'http://127.0.0.1:8002/api/owners/'

for (const [role, username] of [
  ['administrator', 'e2e_admin'],
  ['receptionist', 'e2e_receptionist'],
]) {
  test(`${role} cancels owner deletion without sending a DELETE request`, async ({
    page,
    request,
  }) => {
    const email = `e2e-cancel-delete-${randomUUID()}@example.invalid`
    const phone = '500600705'
    const address = 'ul. Anulowania 6, Testowo'

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

    const createResponse = await request.post(ownersApiUrl, {
      headers,
      data: {
        first_name: 'E2E',
        last_name: 'Anulowanie',
        email,
        phone,
        address,
      },
    })

    expect(createResponse.status()).toBe(201)

    const owner = await createResponse.json()
    const ownerPath = `/api/owners/${owner.id}/`

    /** @type {string[]} */
    const deleteRequests = []

    /**
     * @param {import('@playwright/test').Request} outgoingRequest
     */
    function trackDelete(outgoingRequest) {
      const url = new URL(outgoingRequest.url())

      if (
        outgoingRequest.method() === 'DELETE' &&
        url.pathname === ownerPath
      ) {
        deleteRequests.push(outgoingRequest.url())
      }
    }

    page.on('request', trackDelete)

    try {
      await page.getByRole('link', {
        name: 'Właściciele',
        exact: true,
      }).click()

      const search = page.getByRole('searchbox', {
        name: 'Szukaj właścicieli',
        exact: true,
      })

      async function searchForOwner() {
        const responsePromise = page.waitForResponse((response) => {
          const url = new URL(response.url())

          return (
            response.request().method() === 'GET' &&
            url.pathname === '/api/owners/' &&
            url.searchParams.get('search') === email
          )
        })

        await search.fill(email)

        expect((await responsePromise).status()).toBe(200)
      }

      const ownerRow = page.getByRole('row').filter({
        has: page.getByRole('cell', {
          name: email,
          exact: true,
        }),
      })

      async function checkOwnerData() {
        await expect(ownerRow).toHaveCount(1)

        await expect(ownerRow.getByText('E2E Anulowanie', {
          exact: true,
        })).toBeVisible()

        for (const value of [email, phone, address]) {
          await expect(ownerRow.getByRole('cell', {
            name: value,
            exact: true,
          })).toBeVisible()
        }

        await expect(ownerRow.getByText(`ID: ${owner.id}`, {
          exact: true,
        })).toBeVisible()
      }

      await searchForOwner()
      await checkOwnerData()

      const dialogPromise = page.waitForEvent('dialog')

      const clickPromise = ownerRow.getByRole('button', {
        name: 'Usuń',
        exact: true,
      }).click()

      const dialog = await dialogPromise
      const dialogType = dialog.type()
      const dialogMessage = dialog.message()

      await dialog.dismiss()
      await clickPromise

      expect(dialogType).toBe('confirm')
      expect(dialogMessage).toBe(
        'Czy na pewno chcesz usunąć właściciela E2E Anulowanie?',
      )

      await checkOwnerData()
      expect(deleteRequests).toHaveLength(0)

      await page.reload()
      await searchForOwner()

      await checkOwnerData()
      expect(deleteRequests).toHaveLength(0)
    } finally {
      page.off('request', trackDelete)

      const cleanupResponse = await request.delete(
        `${ownersApiUrl}${owner.id}/`,
        { headers },
      )

      expect([204, 404]).toContain(cleanupResponse.status())
    }
  })
}