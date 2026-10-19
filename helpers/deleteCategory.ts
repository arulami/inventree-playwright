import { APIRequestContext } from '@playwright/test'

// InvenTree requires both flags on category deletion; false keeps any parts and child categories by moving them to the parent.
// Returns quietly when the category no longer exists (404); warns on any other failure.
export async function deleteCategory(request: APIRequestContext, apiUrl: string, authToken: string, categoryPk: number) {
    const response = await request.delete(`${apiUrl}/part/category/${categoryPk}/`, {
        headers: { Authorization: authToken },
        data: { delete_parts: false, delete_child_categories: false },
    })
    if (![204, 404].includes(response.status())) {
        console.warn(`Cleanup failed for category ${categoryPk}: ${response.status()} ${await response.text()}`)
    }
}
