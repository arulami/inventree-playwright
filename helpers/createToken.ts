
import { APILogger } from "../playwright-utils/api/logger"
import { RequestHandler } from "../playwright-utils/api/request-handler"
import { request } from '@playwright/test'
import { config } from '../api-test.config';

export async function createToken(username: string, password: string) {
    const context = await request.newContext();
    const logger = new APILogger()
    const api = new RequestHandler(context, config.apiUrl, logger)
    const basicAuth = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64')

    try {
        // InvenTree issues a token only once per name, so every call needs a unique name
        const tokenResponse = await api
        .path('/user/token/')
        .params({ name: `pw-${username}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` })
        .headers({ Authorization: basicAuth })
        .getRequest(200)
    return 'Token ' + tokenResponse.token

    } catch( error: any ) {

        Error.captureStackTrace(error, createToken)
        throw error

    } finally {
        await context.dispose()
    }





}