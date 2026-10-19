import { APIRequestContext } from '@playwright/test'

// InvenTree only deletes inactive, unlocked parts, so the part is deactivated and unlocked first.
// A UI save still in flight when a test ends can reactivate the part, so a refused delete is retried once.
// Returns quietly when the part no longer exists (404); warns on any other failure.
export async function deletePart(request: APIRequestContext, apiUrl: string, authToken: string, partPk: number) {
    const headers = { Authorization: authToken }
    const partUrl = `${apiUrl}/part/${partPk}/`
    for (let attempt = 1; attempt <= 2; attempt++) {
        const deactivateResponse = await request.patch(partUrl, { headers, data: { active: false, locked: false } })
        if (deactivateResponse.status() === 404) return
        const deleteResponse = await request.delete(partUrl, { headers })
        if ([204, 404].includes(deleteResponse.status())) return
        if (attempt === 2) console.warn(`Cleanup failed for part ${partPk}: ${deleteResponse.status()} ${await deleteResponse.text()}`)
    }
}
