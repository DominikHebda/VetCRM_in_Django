import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

test('rejected refresh token clears stored tokens and returns to login', async ({
  page,
}) => {
  await loginAsUser(page, 'e2e_admin')

  await page.evaluate(() => {
    sessionStorage.setItem(
      'vetcrm_access_token',
      'e2e-invalid-access-token',
    )
    sessionStorage.setItem(
      'vetcrm_refresh_token',
      'e2e-invalid-refresh-token',
    )
  })

  const rejectedApiResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())

    return (
      response.request().method() === 'GET' &&
      url.pathname === '/api/auth/me/' &&
      response.request().headers().authorization ===
        'Bearer e2e-invalid-access-token' &&
      response.status() === 401
    )
  })

  const rejectedRefreshResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    const outgoingRequest = response.request()
    const body = new URLSearchParams(outgoingRequest.postData() ?? '')

    return (
      outgoingRequest.method() === 'POST' &&
      url.pathname === '/o/token/' &&
      body.get('grant_type') === 'refresh_token' &&
      body.get('refresh_token') === 'e2e-invalid-refresh-token'
    )
  })

  await page.reload()

  expect((await rejectedApiResponsePromise).status()).toBe(401)

  const rejectedRefreshResponse = await rejectedRefreshResponsePromise

  expect(rejectedRefreshResponse.status()).toBe(400)

  const refreshError = await rejectedRefreshResponse.json()

  expect(refreshError.error).toBe('invalid_grant')

  await expect(page).toHaveURL('http://127.0.0.1:5174/login')

  await expect(page.getByRole('heading', {
    name: 'Logowanie',
    exact: true,
  })).toBeVisible()

  const loginButton = page.getByRole('button', {
    name: 'Zaloguj przez OAuth 2.0',
    exact: true,
  })

  await expect(loginButton).toBeVisible()
  await expect(loginButton).toBeEnabled()

  const storedTokens = await page.evaluate(() => ({
    accessToken: sessionStorage.getItem('vetcrm_access_token'),
    refreshToken: sessionStorage.getItem('vetcrm_refresh_token'),
  }))

  expect(storedTokens).toEqual({
    accessToken: null,
    refreshToken: null,
  })

  await expect(page.getByRole('button', {
    name: 'Wyloguj',
    exact: true,
  })).toHaveCount(0)

  await page.reload()

  await expect(page).toHaveURL('http://127.0.0.1:5174/login')
  await expect(loginButton).toBeVisible()

  await expect(page.getByRole('heading', {
    name: 'Dashboard',
    exact: true,
  })).toHaveCount(0)
})