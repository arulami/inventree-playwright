import { test } from '../../../playwright-utils/ui/fixtures'
import { getNewPartValues } from '../../../playwright-utils/ui/helpers/test-data'

test.describe('Part management', () => {
  test.beforeEach(async ({ pom }) => {
    await pom.homePage.open()
  })

  test('Engineer can edit a part description', async ({ pom, partCleanup }) => {
    const newPartValues = getNewPartValues('Resistors')
    const editedDescriptionValue = `Edited: ${newPartValues.description}`
    await pom.homePage.openParts()
    const partPk = await pom.partsPage.createPart(newPartValues)
    partCleanup.register(partPk)
    await pom.partDetailPage.editPart({ description: editedDescriptionValue })
    await pom.partDetailPage.expectPartDetails({ ...newPartValues, description: editedDescriptionValue })
  })

  test('Engineer can deactivate and then delete a part', async ({ pom, partCleanup }) => {
    const newPartValues = getNewPartValues('Resistors')
    await pom.homePage.openParts()
    const partPk = await pom.partsPage.createPart(newPartValues)
    partCleanup.register(partPk)
    await pom.partDetailPage.expectDeleteUnavailable()
    await pom.partDetailPage.editPart({ active: false })
    await pom.partDetailPage.expectDetailRows({ Active: 'No' })
    await pom.partDetailPage.deletePart()
    await pom.categoryPage.searchParts(newPartValues.name)
    await pom.categoryPage.expectNoPartsListed()
  })

  test('Engineer cannot delete a locked part', async ({ pom, partCleanup }) => {
    const newPartValues = getNewPartValues('Resistors')
    await pom.homePage.openParts()
    const partPk = await pom.partsPage.createPart(newPartValues)
    partCleanup.register(partPk)
    await pom.partDetailPage.editPart({ locked: true, active: false })
    await pom.partDetailPage.expectDetailRows({ Locked: 'Yes', Active: 'No' })
    await pom.partDetailPage.attemptDeletePart()
    await pom.partDetailPage.expectDeleteRefused('Cannot delete this part as it is locked')
  })
})
