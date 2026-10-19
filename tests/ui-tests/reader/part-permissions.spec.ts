import { test } from '../../../playwright-utils/ui/fixtures'

test.describe('Read-only part access', () => {
  test.beforeEach(async ({ pom }) => {
    await pom.homePage.open()
  })

  test('Read-only user cannot add parts or categories', async ({ pom }) => {
    await pom.homePage.openParts()
    await pom.partsPage.expectAddActionsHidden()
  })

  test('Read-only user cannot edit or delete a part', async ({ pom }) => {
    await pom.homePage.openParts()
    const partNameValue = await pom.partsPage.openFirstListedPart()
    await pom.partDetailPage.expectPartActionsHidden(partNameValue)
  })
})
