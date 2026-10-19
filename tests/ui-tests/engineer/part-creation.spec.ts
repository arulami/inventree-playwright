import { test } from '../../../playwright-utils/ui/fixtures'
import { getNewPartValues } from '../../../playwright-utils/ui/helpers/test-data'

test.describe('Part creation', () => {
  test.beforeEach(async ({ pom }) => {
    await pom.homePage.open()
  })

  test('Engineer can create a part with only the required fields', async ({ pom, partCleanup }) => {
    const newPartValues = getNewPartValues('Resistors')
    await pom.homePage.openParts()
    const partPk = await pom.partsPage.createPart(newPartValues)
    partCleanup.register(partPk)
    await pom.partDetailPage.expectPartDetails(newPartValues)
  })
})
