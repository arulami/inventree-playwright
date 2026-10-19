import { test } from '../../../playwright-utils/ui/fixtures'
import { getNewPartValues } from '../../../playwright-utils/ui/helpers/test-data'
import { faker } from '@faker-js/faker'

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

  test('Engineer can create a part with all optional fields', async ({ pom, partCleanup }) => {
    const newPartValues = {
      ...getNewPartValues('Resistors'),
      ipn: `PW-${faker.string.alphanumeric(8)}`,
      revision: 'A',
      keywords: 'playwright optional fields',
      units: 'm',
      link: 'https://example.com/datasheet.pdf',
      minimumStock: 5,
      maximumStock: 50,
    }
    await pom.homePage.openParts()
    const partPk = await pom.partsPage.createPart(newPartValues)
    partCleanup.register(partPk)
    await pom.partDetailPage.expectPartDetails(newPartValues)
    await pom.partDetailPage.expectDetailRows({
      IPN: newPartValues.ipn,
      Revision: newPartValues.revision,
      Keywords: newPartValues.keywords,
      Units: newPartValues.units,
      Link: newPartValues.link,
      'Minimum Stock': `${newPartValues.minimumStock} [${newPartValues.units}]`,
      'Maximum Stock': `${newPartValues.maximumStock} [${newPartValues.units}]`,
    })
  })

  test('Engineer must enter a name before a part is created', async ({ pom, partCleanup }) => {
    const newPartValues = getNewPartValues('Resistors')
    await pom.homePage.openParts()
    await pom.partsPage.submitPartFormWithoutName(newPartValues)
    await pom.partsPage.expectNameRequiredError()
    const partPk = await pom.partsPage.completeNameAndSubmit(newPartValues.name)
    partCleanup.register(partPk)
    await pom.partDetailPage.expectPartDetails(newPartValues)
  })
})
