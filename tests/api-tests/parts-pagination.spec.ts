import { test } from '../../playwright-utils/api/fixtures'
import { expect } from '../../playwright-utils/api/custom-expect'
import { getNewRandomPart } from '../../playwright-utils/api/data-generator'


test.describe('Parts pagination', () => {
    let categoryPk: number

    test.beforeEach(async ({ api }) => {
        const categoriesResponse = await api
            .path('/part/category/')
            .params({ limit: 1 })
            .getRequest(200)
        categoryPk = categoriesResponse.results[0].pk
    })

    ;[
        { caseName: 'zero', limit: 0 },
        { caseName: 'negative', limit: -1 },
        { caseName: 'non-numeric', limit: 'abc' },
    ].forEach(({ caseName, limit }) => {
        test(`Engineer gets the unpaginated parts list with a ${caseName} page size`, async ({ api, partCleanup }) => {
            const createPartResponse = await api
                .path('/part/')
                .body(getNewRandomPart(categoryPk))
                .postRequest(201)
            partCleanup.register(createPartResponse.pk)

            const partsResponse = await api
                .path('/part/')
                .params({ limit })
                .getRequest(200)
            expect(Array.isArray(partsResponse)).shouldEqual(true)
            expect(partsResponse.some((part: { pk: number }) => part.pk === createPartResponse.pk)).shouldEqual(true)
        })
    })

    test('Engineer gets the first page with a negative offset', async ({ api }) => {
        const negativeOffsetResponse = await api
            .path('/part/')
            .params({ limit: 5, offset: -5, ordering: 'id' })
            .getRequest(200)
        const firstPageResponse = await api
            .path('/part/')
            .params({ limit: 5, offset: 0, ordering: 'id' })
            .getRequest(200)
        await expect(negativeOffsetResponse).shouldMatchSchema('parts', 'GET_parts')
        expect(negativeOffsetResponse.previous).shouldEqual(null)
        expect(negativeOffsetResponse.results.map((part: { pk: number }) => part.pk)).shouldEqual(firstPageResponse.results.map((part: { pk: number }) => part.pk))
    })
})
