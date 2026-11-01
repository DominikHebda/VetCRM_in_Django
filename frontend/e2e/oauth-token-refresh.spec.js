import { expect, test } from '@playwright/test'

import { loginAsUser } from './helpers/auth.js'

const invalidAccessToken = 'e2e-invalid-access-token'

test('administrator refreshes a rejected access token without logging in again', async ({
  page,
}) => {
  await loginAsUser(page, 'e2e_admin')

  const originalTokens = await page.evaluate(() => ({
    accessToken: sessionStorage.getItem('vetcrm_access_token'),
    refreshToken: sessionStorage.getItem('vetcrm_refresh_token'),
  }))

  expect(Boolean(originalTokens.accessToken)).toBe(true)
  expect(Boolean(originalTokens.refreshToken)).toBe(true)

  await page.evaluate((invalidToken) => {
    sessionStorage.setItem('vetcrm_access_token', invalidToken)
  }, invalidAccessToken)

  const rejectedResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())

    return (
      response.request().method() === 'GET' &&
      url.pathname === '/api/auth/me/' &&
      response.request().headers().authorization ===
        `Bearer ${invalidAccessToken}` &&
      response.status() === 401
    )
  })

  const refreshResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    const outgoingRequest = response.request()
    const body = new URLSearchParams(outgoingRequest.postData() ?? '')

    return (
      outgoingRequest.method() === 'POST' &&
      url.pathname === '/o/token/' &&
      body.get('grant_type') === 'refresh_token'
    )
  })

  const recoveredResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    const authorization = response.request().headers().authorization

    return (
      response.request().method() === 'GET' &&
      url.pathname === '/api/auth/me/' &&
      Boolean(authorization) &&
      authorization !== `Bearer ${invalidAccessToken}` &&
      authorization !== `Bearer ${originalTokens.accessToken}` &&
      response.status() === 200
    )
  })

  await page.reload()

  expect((await rejectedResponsePromise).status()).toBe(401)

  const refreshResponse = await refreshResponsePromise

  expect(refreshResponse.status()).toBe(200)

  const refreshedTokens = await refreshResponse.json()

  expect(Boolean(refreshedTokens.access_token)).toBe(true)

  expect(
    refreshedTokens.access_token !== originalTokens.accessToken,
  ).toBe(true)

  const recoveredResponse = await recoveredResponsePromise

  expect(
    recoveredResponse.request().headers().authorization ===
      `Bearer ${refreshedTokens.access_token}`,
  ).toBe(true)

  const currentUser = await recoveredResponse.json()

  expect(currentUser.username).toBe('e2e_admin')

  await expect(page).toHaveURL('http://127.0.0.1:5174/')

  await expect(page.getByRole('heading', {
    name: 'Dashboard',
    exact: true,
  })).toBeVisible()

  await expect(page.getByText('e2e_admin', {
    exact: true,
  })).toBeVisible()

  const storedTokenMatches = await page.evaluate((expectedToken) =>
    sessionStorage.getItem('vetcrm_access_token') === expectedToken,
  refreshedTokens.access_token)

  expect(storedTokenMatches).toBe(true)

  const nextLoadResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())

    return (
      response.request().method() === 'GET' &&
      url.pathname === '/api/auth/me/' &&
      response.request().headers().authorization ===
        `Bearer ${refreshedTokens.access_token}` &&
      response.status() === 200
    )
  })

  await page.reload()

  expect((await nextLoadResponsePromise).status()).toBe(200)

  await expect(page.getByRole('heading', {
    name: 'Dashboard',
    exact: true,
  })).toBeVisible()

  await expect(page.getByText('e2e_admin', {
    exact: true,
  })).toBeVisible()
})