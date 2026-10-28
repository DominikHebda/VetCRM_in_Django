import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

for (const [role, username] of [
  ['administrator', 'e2e_admin'],
  ['receptionist', 'e2e_receptionist'],
  ['veterinarian', 'e2e_vet'],
]) {
  test(`${role} navigates owner pages and returns to page one after searching`, async ({
    page,
  }) => {
    const query = 'e2e-pagination-'
    const emails = Array.from(
      { length: 12 },
      (_, index) =>
        `e2e-pagination-${String(index + 1).padStart(2, '0')}@example.invalid`,
    )

    await loginAsUser(page, username)

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
     * @param {string} searchQuery
     * @param {number} pageNumber
     */
    function waitForOwners(searchQuery, pageNumber) {
      return page.waitForResponse((response) => {
        const url = new URL(response.url())

        return (
          response.request().method() === 'GET' &&
          url.pathname === '/api/owners/' &&
          url.searchParams.get('search') === searchQuery &&
          Number(url.searchParams.get('page') ?? '1') === pageNumber
        )
      })
    }

    /**
     * @param {number} pageNumber
     * @param {string[]} expectedEmails
     */
    async function checkPage(pageNumber, expectedEmails) {
      await expect(page.getByText(`Strona ${pageNumber}`, {
        exact: true,
      })).toBeVisible()

      const rows = page.getByRole('table').locator('tbody tr')

      await expect(rows).toHaveCount(expectedEmails.length)

      await expect(
        rows.locator('td:nth-child(2)'),
      ).toHaveText(expectedEmails)
    }

    const firstPageResponse = waitForOwners(query, 1)

    await search.fill(query)

    expect((await firstPageResponse).status()).toBe(200)

    await checkPage(1, emails.slice(0, 10))
    await expect(previousButton).toBeDisabled()
    await expect(nextButton).toBeEnabled()

    const secondPageResponse = waitForOwners(query, 2)

    await nextButton.click()

    expect((await secondPageResponse).status()).toBe(200)

    await checkPage(2, emails.slice(10))
    await expect(previousButton).toBeEnabled()
    await expect(nextButton).toBeDisabled()

    const backResponse = waitForOwners(query, 1)

    await previousButton.click()

    expect((await backResponse).status()).toBe(200)

    await checkPage(1, emails.slice(0, 10))
    await expect(previousButton).toBeDisabled()
    await expect(nextButton).toBeEnabled()

    const secondVisitResponse = waitForOwners(query, 2)

    await nextButton.click()

    expect((await secondVisitResponse).status()).toBe(200)

    await checkPage(2, emails.slice(10))

    const narrowedQuery = emails[0]
    const narrowedResponse = waitForOwners(narrowedQuery, 1)

    await search.fill(narrowedQuery)

    expect((await narrowedResponse).status()).toBe(200)

    await checkPage(1, [narrowedQuery])
    await expect(previousButton).toBeDisabled()
    await expect(nextButton).toBeDisabled()

    await expect(
      page.locator('.page-summary strong'),
    ).toHaveText('1')

    const restoredResponse = waitForOwners(query, 1)

    await search.fill(query)

    expect((await restoredResponse).status()).toBe(200)

    await checkPage(1, emails.slice(0, 10))
    await expect(previousButton).toBeDisabled()
    await expect(nextButton).toBeEnabled()

    await expect(
      page.locator('.page-summary strong'),
    ).toHaveText('12')
  })
}