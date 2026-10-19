import { test } from '../../playwright-utils/api/fixtures'
import { expect } from '../../playwright-utils/api/custom-expect'
import { getNewRandomPart } from '../../playwright-utils/api/data-generator'


test.describe('Parts CRUD', () => {
    let categoryPk: number

    test.beforeEach(async ({ api }) => {
        const categoriesResponse = await api
            .path('/part/category/')
            .params({ limit: 1 })
            .getRequest(200)
        categoryPk = categoriesResponse.results[0].pk
    })

    test('Engineer can create, read and delete a part', async ({ api, partCleanup }) => {
        const partRequest = getNewRandomPart(categoryPk)
        const createPartResponse = await api
            .path('/part/')
            .body(partRequest)
            .postRequest(201)
        partCleanup.register(createPartResponse.pk)
        await expect(createPartResponse).shouldMatchSchema('parts', 'POST_parts')
        expect(createPartResponse.name).shouldEqual(partRequest.name)
        expect(createPartResponse.category).shouldEqual(categoryPk)
        expect(createPartResponse.active).shouldEqual(true)

        const partResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .getRequest(200)
        expect(partResponse.name).shouldEqual(partRequest.name)
        expect(partResponse.description).shouldEqual(partRequest.description)

        await api
            .path(`/part/${createPartResponse.pk}/`)
            .body({ active: false })
            .patchRequest(200)
        await api
            .path(`/part/${createPartResponse.pk}/`)
            .deleteRequest(204)

        const deletedPartResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .getRequest(404)
        expect(deletedPartResponse.detail).shouldEqual('No Part matches the given query.')
    })

    test('Engineer can update a part description', async ({ api, partCleanup }) => {
        const createPartResponse = await api
            .path('/part/')
            .body(getNewRandomPart(categoryPk))
            .postRequest(201)
        partCleanup.register(createPartResponse.pk)

        const updatedPartRequest = getNewRandomPart(categoryPk)
        const updatePartResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .body({ description: updatedPartRequest.description })
            .patchRequest(200)
        expect(updatePartResponse.description).shouldEqual(updatedPartRequest.description)
        expect(updatePartResponse.name).shouldEqual(createPartResponse.name)

        const partResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .getRequest(200)
        expect(partResponse.description).shouldEqual(updatedPartRequest.description)
    })

    test('Engineer cannot delete an active part', async ({ api, partCleanup }) => {
        const createPartResponse = await api
            .path('/part/')
            .body(getNewRandomPart(categoryPk))
            .postRequest(201)
        partCleanup.register(createPartResponse.pk)

        const deletePartResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .deleteRequest(400)
        expect(deletePartResponse.non_field_errors[0]).shouldEqual('Cannot delete this part as it is still active')

        const partResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .getRequest(200)
        expect(partResponse.active).shouldEqual(true)
    })

    test('Engineer cannot delete a locked part', async ({ api, partCleanup }) => {
        const createPartResponse = await api
            .path('/part/')
            .body(getNewRandomPart(categoryPk))
            .postRequest(201)
        partCleanup.register(createPartResponse.pk)

        const lockPartResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .body({ locked: true, active: false })
            .patchRequest(200)
        expect(lockPartResponse.locked).shouldEqual(true)
        expect(lockPartResponse.active).shouldEqual(false)

        const deletePartResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .deleteRequest(400)
        expect(deletePartResponse.non_field_errors[0]).shouldEqual('Cannot delete this part as it is locked')

        const partResponse = await api
            .path(`/part/${createPartResponse.pk}/`)
            .getRequest(200)
        expect(partResponse.locked).shouldEqual(true)
    })
})
