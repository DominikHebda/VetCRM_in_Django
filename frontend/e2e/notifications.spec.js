import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

const notificationTypes = [
  {
    title: 'Zbliżające się szczepienie',
    linkText: 'Otwórz szczepienia',
    path: '/vaccinations',
  },
  {
    title: 'Wygasająca recepta',
    linkText: 'Otwórz recepty',
    path: '/prescriptions',
  },
  {
    title: 'Dzisiejsza wizyta',
    linkText: 'Otwórz wizyty',
    path: '/visits',
  },
]

for (const { role, username, visiblePatients } of [
  {
    role: 'administrator',
    username: 'e2e_admin',
    visiblePatients: ['A', 'B'],
  },
  {
    role: 'receptionist',
    username: 'e2e_receptionist',
    visiblePatients: ['A', 'B'],
  },
  {
    role: 'first veterinarian',
    username: 'e2e_vet',
    visiblePatients: ['A'],
  },
  {
    role: 'second veterinarian',
    username: 'e2e_vet_other',
    visiblePatients: ['B'],
  },
]) {
  test(`${role} sees the correct notifications before and after refresh`, async ({
    page,
  }) => {
    await loginAsUser(page, username)

    const initialResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'GET' &&
        url.pathname === '/api/notifications/'
      )
    })

    await page.getByRole('link', {
      name: 'Powiadomienia',
      exact: true,
    }).click()

    expect((await initialResponse).status()).toBe(200)

    await expect(page.getByRole('heading', {
      name: 'Powiadomienia',
      exact: true,
    })).toBeVisible()

    async function checkNotificationScope() {
      for (const suffix of ['A', 'B']) {
        const cards = page.getByRole('article').filter({
          hasText: `E2E Powiadomienia ${suffix}`,
        })

        if (!visiblePatients.includes(suffix)) {
          await expect(cards).toHaveCount(0)
          continue
        }

        await expect(cards).toHaveCount(3)

        for (const details of notificationTypes) {
          const card = cards.filter({
            has: page.getByRole('heading', {
              name: details.title,
              exact: true,
            }),
          })

          await expect(card).toHaveCount(1)
          await expect(card).toBeVisible()

          await expect(card.getByRole('link', {
            name: details.linkText,
            exact: true,
          })).toHaveAttribute('href', details.path)

          await expect(card.locator('time')).toBeVisible()
        }
      }
    }

    const refreshButton = page.getByRole('button', {
      name: 'Odśwież dane',
      exact: true,
    })

    await expect(refreshButton).toBeEnabled()
    await checkNotificationScope()

    const refreshResponse = page.waitForResponse((response) => {
      const url = new URL(response.url())

      return (
        response.request().method() === 'GET' &&
        url.pathname === '/api/notifications/'
      )
    })

    await refreshButton.click()

    expect((await refreshResponse).status()).toBe(200)
    await expect(refreshButton).toBeEnabled()
    await checkNotificationScope()
  })
}