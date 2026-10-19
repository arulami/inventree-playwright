import { test } from '../../playwright-utils/api/fixtures'
import { expect } from '../../playwright-utils/api/custom-expect'
import { getNewRandomPart } from '../../playwright-utils/api/data-generator'


test.describe('Part validation', () => {
    let categoryPk: number

    test.beforeEach(async ({ api }) => {
        const categoriesResponse = await api
            .path('/part/category/')
            .params({ limit: 1 })
            .getRequest(200)
        categoryPk = categoriesResponse.results[0].pk
    })

    ;[
        { caseName: 'without a name', override: { name: undefined }, field: 'name', expectedError: 'This field is required.' },
        { caseName: 'with a blank name', override: { name: '' }, field: 'name', expectedError: 'This field may not be blank.' },
        { caseName: 'with a 101-character name', override: { name: 'x'.repeat(101) }, field: 'name', expectedError: 'Ensure this field has no more than 100 characters.' },
        { caseName: 'in a non-existent category', override: { category: 99999999 }, field: 'category', expectedError: 'Invalid pk "99999999" - object does not exist.' },
        { caseName: 'with a negative minimum stock', override: { minimum_stock: -5 }, field: 'minimum_stock', expectedError: 'Ensure this value is greater than or equal to 0.' },
        { caseName: 'with an invalid external link', override: { link: 'not a url' }, field: 'link', expectedError: 'Enter a valid URL.' },
        { caseName: 'with an invalid unit', override: { units: 'blargs' }, field: 'units', expectedError: 'Invalid physical unit' },
    ].forEach(({ caseName, override, field, expectedError }) => {
        test(`Engineer cannot create a part ${caseName}`, async ({ api, partCleanup }) => {
            const partRequest = { ...getNewRandomPart(categoryPk), ...override }
            const response = await api
                .path('/part/')
                .body(partRequest)
                .postRequest(400)
            if (response.pk) partCleanup.register(response.pk)
            expect(response[field][0]).shouldEqual(expectedError)
        })
    })

    test('Read-only user cannot create a part', async ({ api, readerToken, partCleanup }) => {
        const response = await api
            .path('/part/')
            .headers({ Authorization: readerToken })
            .body(getNewRandomPart(categoryPk))
            .postRequest(403)
        if (response.pk) partCleanup.register(response.pk)
        expect(response.detail).shouldEqual('You do not have permission to perform this action.')
    })
})
