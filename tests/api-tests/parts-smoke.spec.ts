import { test } from '../../playwright-utils/api/fixtures'
import { expect } from '../../playwright-utils/api/custom-expect'


test('Engineer can list parts', async ({ api }) => {
    const response = await api
        .path('/part/')
        .params({ limit: 10, offset: 0 })
        .getRequest(200)
    await expect(response).shouldMatchSchema('parts', 'GET_parts')
    expect(response.results.length).shouldBeLessThanOrEqual(10)
    expect(response.results.length).shouldBeLessThanOrEqual(response.count)
})

test('Engineer can list part categories', async ({ api }) => {
    const response = await api
        .path('/part/category/')
        .params({ limit: 10, offset: 0 })
        .getRequest(200)
    await expect(response).shouldMatchSchema('categories', 'GET_categories')
    expect(response.results.length).shouldBeLessThanOrEqual(10)
    expect(response.results.length).shouldBeLessThanOrEqual(response.count)
})

test('Unauthenticated user cannot list parts', async ({ api }) => {
    const response = await api
        .path('/part/')
        .params({ limit: 1 })
        .clearAuth()
        .getRequest(401)
    expect(response.detail).shouldEqual('Authentication credentials were not provided.')
})
