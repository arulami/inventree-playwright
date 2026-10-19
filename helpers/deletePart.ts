import { APIRequestContext } from '@playwright/test'

// InvenTree only deletes inactive parts, so the part is deactivated first.
// Returns quietly when the part no longer exists (404); warns on any other failure.
export async function deletePart(request: APIRequestContext, apiUrl: string, authToken: string, partPk: number) {
    const headers = { Authorization: authToken }
    const partUrl = `${apiUrl}/part/${partPk}/`
    const deactivateResponse = await request.patch(partUrl, { headers, data: { active: false } })
    if (deactivateResponse.status() === 404) return
    const deleteResponse = await request.delete(partUrl, { headers })
    if (![204, 404].includes(deleteResponse.status())) {
        console.warn(`Cleanup failed for part ${partPk}: ${deleteResponse.status()} ${await deleteResponse.text()}`)
    }
}
