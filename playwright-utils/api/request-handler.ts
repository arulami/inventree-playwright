import { APIRequestContext } from "@playwright/test"
import { test, expect } from '@playwright/test'
import { APILogger } from "./logger"

export class RequestHandler {

    private request: APIRequestContext
    private logger: APILogger
    private baseUrl: string | undefined
    private defaultBaseUrl: string
    private apiPath: string = ''
    private queryParams: object = {}
    private apiHeaders: Record<string, string> = {}
    private apiBody: object = {}
    private defaultAuthToken: string
    private clearAuthFlag: boolean = false

    constructor(request: APIRequestContext, apiBaseUrl: string, logger: APILogger, authToken: string = '') {
        this.request = request
        this.defaultBaseUrl = apiBaseUrl
        this.logger = logger
        this.defaultAuthToken = authToken
    }

    url(url: string) {
        this.baseUrl = url
        return this
    }

    path(path: string) {
        this.apiPath = path
        return this

    }

    params(params: object) {
        this.queryParams = params
        return this
    }

    headers(headers: Record<string, string>) {
        this.apiHeaders = headers
        return this
    }

    body(body: object) {
        this.apiBody = body
        return this
    }

    clearAuth() {
        this.clearAuthFlag = true
        return this
    }

    async getRequest(statusCode: number) {
        let responseJSON: any

        const url = this.getUrl()
        await test.step(`GET request to: ${url}`, async () => {
            this.logger.logRequest('GET', url, this.getHeaders())
            const response = await this.request.get(url, {
                headers: this.getHeaders()
            })
            this.cleanupFields()
            const actualStatus = response.status()
            responseJSON = await response.json()

            this.logger.logResponse(actualStatus, responseJSON)
            this.stausCodeValidator(actualStatus, statusCode, this.getRequest)
        })

        return responseJSON
    }

    async postRequest(statusCode: number) {
        let responseJSON: any
        const url = this.getUrl()

        await test.step(`POST request to: ${url}`, async () => {
            this.logger.logRequest('POST', url, this.getHeaders(), this.apiBody)
            const response = await this.request.post(url, {
                headers: this.getHeaders(),
                data: this.apiBody
            })
            this.cleanupFields()
            const actualStatus = response.status()
            responseJSON = await response.json()

            this.logger.logResponse(actualStatus, responseJSON)
            this.stausCodeValidator(actualStatus, statusCode, this.postRequest)
        })

        return responseJSON
    }

    async putRequest(statusCode: number) {
        let responseJSON: any
        const url = this.getUrl()

        await test.step(`PUT request to: ${url}`, async () => {
            this.logger.logRequest('PUT', url, this.getHeaders(), this.apiBody)
            const response = await this.request.put(url, {
                headers: this.getHeaders(),
                data: this.apiBody
            })
            this.cleanupFields()
            const actualStatus = response.status()
            responseJSON = await response.json()

            this.logger.logResponse(actualStatus, responseJSON)
            this.stausCodeValidator(actualStatus, statusCode, this.putRequest)
        })

        return responseJSON
    }

    async patchRequest(statusCode: number) {
        let responseJSON: any
        const url = this.getUrl()

        await test.step(`PATCH request to: ${url}`, async () => {
            this.logger.logRequest('PATCH', url, this.getHeaders(), this.apiBody)
            const response = await this.request.patch(url, {
                headers: this.getHeaders(),
                data: this.apiBody
            })
            this.cleanupFields()
            const actualStatus = response.status()
            responseJSON = await response.json()

            this.logger.logResponse(actualStatus, responseJSON)
            this.stausCodeValidator(actualStatus, statusCode, this.patchRequest)
        })

        return responseJSON
    }

    async deleteRequest(statusCode: number) {
        let responseJSON: any
        const url = this.getUrl()
        await test.step(`DELETE request to: ${url}`, async () => {
            this.logger.logRequest('DELETE', url, this.getHeaders())
            const response = await this.request.delete(url, {
                headers: this.getHeaders()
            })
            this.cleanupFields()
            const actualStatus = response.status()
            const responseText = await response.text()
            responseJSON = responseText ? JSON.parse(responseText) : undefined
            this.logger.logResponse(actualStatus, responseJSON)
            this.stausCodeValidator(actualStatus, statusCode, this.deleteRequest)

        })

        return responseJSON
    }

    private getUrl() {
        const url = new URL(`${this.baseUrl ?? this.defaultBaseUrl}${this.apiPath}`)
        for (const [key, value] of Object.entries(this.queryParams)) {
            url.searchParams.append(key, value)
        }
        return url.toString()
    }

    private stausCodeValidator(actualStatus: number, expectedStatus: number, callingMethod: Function) {
        if (actualStatus !== expectedStatus) {
            const logs = this.logger.getRecentLogs()
            const error = new Error(`Expected status ${expectedStatus} but got ${actualStatus}\n\nRecent API Activity: \n${logs}`)
            Error.captureStackTrace(error, callingMethod)
            throw error
        }
    }

    private getHeaders() {
        if (!this.clearAuthFlag) {
            this.apiHeaders['Authorization'] = this.apiHeaders['Authorization'] || this.defaultAuthToken
        }
        return this.apiHeaders
    }

    private cleanupFields() {
        this.apiBody = {}
        this.apiHeaders = {}
        this.baseUrl = undefined
        this.apiPath = ''
        this.queryParams = {}
        this.clearAuthFlag = false
    }
}