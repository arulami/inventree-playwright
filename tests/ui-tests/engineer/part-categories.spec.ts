import { test } from '../../../playwright-utils/ui/fixtures'
import { getNewCategoryValues, getNewPartValues } from '../../../playwright-utils/ui/helpers/test-data'

test.describe('Part categories', () => {
  test.beforeEach(async ({ pom }) => {
    await pom.homePage.open()
  })

  test('Engineer can create a category with a sub-category', async ({ pom, categoryCleanup }) => {
    const parentCategoryValues = getNewCategoryValues()
    const childCategoryValues = getNewCategoryValues()
    await pom.homePage.openParts()
    categoryCleanup.register(await pom.categoryPage.createCategory(parentCategoryValues))
    categoryCleanup.register(await pom.categoryPage.createCategory(childCategoryValues))
    await pom.breadcrumbComponent.expectCategoryPath([parentCategoryValues.name, childCategoryValues.name])
    await pom.breadcrumbComponent.openCategory(parentCategoryValues.name)
    await pom.categoryPage.expectSubcategory({ name: childCategoryValues.name, path: `${parentCategoryValues.name}/${childCategoryValues.name}` })
  })

  test('Category lists parts from its sub-categories', async ({ pom, categoryCleanup, partCleanup }) => {
    const parentCategoryValues = getNewCategoryValues()
    const childCategoryValues = getNewCategoryValues()
    const newPartValues = getNewPartValues(childCategoryValues.name)
    await pom.homePage.openParts()
    categoryCleanup.register(await pom.categoryPage.createCategory(parentCategoryValues))
    categoryCleanup.register(await pom.categoryPage.createCategory(childCategoryValues))
    partCleanup.register(await pom.partsPage.createPart(newPartValues))
    await pom.breadcrumbComponent.openCategory(parentCategoryValues.name)
    await pom.categoryPage.searchParts(newPartValues.name)
    await pom.categoryPage.expectPartListed({ name: newPartValues.name, categoryName: childCategoryValues.name, stock: 'No stock' })
  })
})
