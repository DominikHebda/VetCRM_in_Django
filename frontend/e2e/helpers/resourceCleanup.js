import { expect } from '@playwright/test'

/**
 * @param {typeof import('@playwright/test').test} test
 */
function registerResourceCleanup(test) {
  /**
   * @type {Map<
   *   import('@playwright/test').Page,
   *   { url: string, authorization: string }
   * >}
   */
  const resources = new Map()

  test.afterEach(async ({ page, request }) => {
    const resource = resources.get(page)

    if (!resource) {
      return
    }

    resources.delete(page)

    const headers = {
      Authorization: resource.authorization,
    }

    const deleteResponse = await request.delete(resource.url, { headers })
    expect(deleteResponse.status()).toBe(204)

    const verificationResponse = await request.get(resource.url, { headers })
    expect(verificationResponse.status()).toBe(404)
  })

  /**
   * @param {import('@playwright/test').Page} page
   * @param {import('@playwright/test').Response} createResponse
   * @param {number} id
   */
  function trackCreatedResource(page, createResponse, id) {
    const authorization = createResponse.request().headers().authorization

    if (!authorization) {
      throw new Error('Brak nagłówka autoryzacji żądania tworzącego rekord.')
    }

    resources.set(page, {
      url: new URL(`${id}/`, createResponse.url()).href,
      authorization,
    })
  }

  return trackCreatedResource
}

export { registerResourceCleanup }