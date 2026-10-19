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
        { caseName: 'with a null name', override: { name: null }, field: 'name', expectedError: 'This field may not be null.' },
        { caseName: 'with a null description', override: { description: null }, field: 'description', expectedError: 'This field may not be null.' },
        { caseName: 'with a null IPN', override: { IPN: null }, field: 'IPN', expectedError: 'This field may not be null.' },
        { caseName: 'with a null minimum stock', override: { minimum_stock: null }, field: 'minimum_stock', expectedError: 'This field may not be null.' },
        { caseName: 'with a null assembly flag', override: { assembly: null }, field: 'assembly', expectedError: 'This field may not be null.' },
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

    test('Engineer cannot update a part name to null', async ({ api, partCleanup }) => {
        const createPartResponse = await api
            .path('/part/')
            .body(getNewRandomPart(categoryPk))
            .postRequest(201)
        partCleanup.register(createPartResponse.pk)

        const updatePartResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .body({ name: null })
            .patchRequest(400)
        expect(updatePartResponse.name[0]).shouldEqual('This field may not be null.')

        const partResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .getRequest(200)
        expect(partResponse.name).shouldEqual(createPartResponse.name)
    })

    test('Read-only user cannot update a part', async ({ api, readerToken, partCleanup }) => {
        const createPartResponse = await api
            .path('/part/')
            .body(getNewRandomPart(categoryPk))
            .postRequest(201)
        partCleanup.register(createPartResponse.pk)

        const updatePartResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .headers({ Authorization: readerToken })
            .body({ description: 'Edited by reader' })
            .patchRequest(403)
        expect(updatePartResponse.detail).shouldEqual('You do not have permission to perform this action.')

        const partResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .getRequest(200)
        expect(partResponse.description).shouldEqual(createPartResponse.description)
    })

    test('Read-only user cannot delete a part', async ({ api, readerToken, partCleanup }) => {
        const createPartResponse = await api
            .path('/part/')
            .body(getNewRandomPart(categoryPk))
            .postRequest(201)
        partCleanup.register(createPartResponse.pk)
        await api
            .path(`/part/${createPartResponse.pk}/`)
            .body({ active: false })
            .patchRequest(200)

        const deletePartResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .headers({ Authorization: readerToken })
            .deleteRequest(403)
        expect(deletePartResponse.detail).shouldEqual('You do not have permission to perform this action.')

        const partResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .getRequest(200)
        expect(partResponse.pk).shouldEqual(createPartResponse.pk)
    })
})
