import { test } from '../../../playwright-utils/ui/fixtures'
import { getNewPartValues } from '../../../playwright-utils/ui/helpers/test-data'

test.describe('Part stock flow', () => {
  test.beforeEach(async ({ pom }) => {
    await pom.homePage.open()
  })

  test('Stock user can create a part, add a parameter and stock, and find it in the parent category', async ({ pom, partCleanup }) => {
    const newPartValues = getNewPartValues('Resistors')
    const parameterValues = { templateName: 'Length', templateOption: 'Length Part length [mm]', data: '6.3' }
    const stockValues = { quantity: 25, locationName: 'Factory' }
    await pom.homePage.openParts()
    partCleanup.register(await pom.partsPage.createPart(newPartValues))
    await pom.partDetailPage.addParameter(parameterValues)
    await pom.partDetailPage.expectParameter({ templateName: parameterValues.templateName, value: parameterValues.data })
    await pom.partDetailPage.addStockItem(stockValues)
    await pom.stockItemPage.expectStockItem({ partName: newPartValues.name, ...stockValues })
    await pom.stockItemPage.openBasePart(newPartValues.name)
    await pom.partDetailPage.expectDetailRows({ 'In Stock': `${stockValues.quantity}` })
    await pom.breadcrumbComponent.openCategory('Passives')
    await pom.categoryPage.searchParts(newPartValues.name)
    await pom.categoryPage.expectPartListed({ name: newPartValues.name, categoryName: newPartValues.categoryName, stock: `${stockValues.quantity}` })
  })
})
