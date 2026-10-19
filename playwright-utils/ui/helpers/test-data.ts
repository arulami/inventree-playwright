import { faker } from '@faker-js/faker'

export function getNewPartValues(categoryName: string) {
  return {
    name: `PW ${faker.commerce.productName()} ${faker.string.alphanumeric(6)}`,
    description: faker.lorem.sentence(6),
    categoryName,
  }
}
