import { expect, test } from '@playwright/test'

test('administrator corrects an invalid password and logs in successfully', async ({
  page,
}) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)

  await page.getByRole('button', {
    name: 'Zaloguj przez OAuth 2.0',
    exact: true,
  }).click()

  const loginHeading = page.getByRole('heading', {
    name: 'Logowanie do VetCRM',
    exact: true,
  })

  await expect(loginHeading).toBeVisible()

  const usernameInput = page.getByLabel('Nazwa użytkownika', {
    exact: true,
  })

  const passwordInput = page.getByLabel('Hasło', {
    exact: true,
  })

  const submitButton = page.getByRole('button', {
    name: 'Zaloguj',
    exact: true,
  })

  /** @type {string[]} */
  const tokenRequests = []

  page.on('request', (outgoingRequest) => {
    const url = new URL(outgoingRequest.url())

    if (
      outgoingRequest.method() === 'POST' &&
      url.pathname === '/o/token/'
    ) {
      tokenRequests.push(outgoingRequest.url())
    }
  })

  await usernameInput.fill('e2e_admin')
  await passwordInput.fill('Niepoprawne-Haslo-E2E!')

  await submitButton.click()

  const errorMessage = page.getByText(
    'Nieprawidłowa nazwa użytkownika lub hasło.',
    { exact: true },
  )

  await expect(errorMessage).toBeVisible()
  await expect(loginHeading).toBeVisible()

  await expect(page).toHaveURL(
    /^http:\/\/127\.0\.0\.1:8002\/accounts\/login\/\?/,
  )

  await expect(usernameInput).toHaveValue('e2e_admin')

  await expect(page.getByRole('heading', {
    name: 'Dashboard',
    exact: true,
  })).toHaveCount(0)

  expect(tokenRequests).toHaveLength(0)

  await passwordInput.fill('E2e-Login-Only-42!')

  const tokenResponsePromise = page.waitForResponse((response) => {
    const url = new URL(response.url())
    const outgoingRequest = response.request()
    const body = new URLSearchParams(outgoingRequest.postData() ?? '')

    return (
      outgoingRequest.method() === 'POST' &&
      url.pathname === '/o/token/' &&
      body.get('grant_type') === 'authorization_code'
    )
  })

  await submitButton.click()

  expect((await tokenResponsePromise).status()).toBe(200)

  await expect(page).toHaveURL('http://127.0.0.1:5174/')

  await expect(page.getByRole('heading', {
    name: 'Dashboard',
    exact: true,
  })).toBeVisible()

  await expect(page.getByText('e2e_admin', {
    exact: true,
  })).toBeVisible()

  await expect(errorMessage).toHaveCount(0)

  await page.reload()

  await expect(page.getByRole('heading', {
    name: 'Dashboard',
    exact: true,
  })).toBeVisible()

  await expect(page.getByText('e2e_admin', {
    exact: true,
  })).toBeVisible()
})