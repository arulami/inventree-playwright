import partRequestPayload from '../../request-objects/POST-part.json'
import { faker } from '@faker-js/faker'

export function getNewRandomPart(categoryPk: number){
    const partRequest = structuredClone(partRequestPayload) as typeof partRequestPayload & { category: number }
    partRequest.name = `PW ${faker.commerce.productName()} ${faker.string.alphanumeric(6)}`
    partRequest.description = faker.lorem.sentence(6)
    partRequest.category = categoryPk
    return partRequest
}
