import { test as base } from '@playwright/test'
import { RequestHandler } from './request-handler'
import { APILogger } from './logger'
import { setCustomExpectLogger } from './custom-expect'
import { config } from '../../api-test.cofig';
import { createToken } from '../../helpers/createToken';
import { deletePart } from '../../helpers/deletePart';

export type TestOptions = {
    api: RequestHandler,
    config: typeof config,
    partCleanup: { register: (partPk: number) => void }
}

export type WorkerFixture = {
    authToken: string,
    readerToken: string
}

export const test = base.extend<TestOptions, WorkerFixture>({
    authToken: [ async ( {}, use ) => {
        const authToken = await createToken(config.username, config.password)
        await use(authToken)

    }, { scope: 'worker'} ],

    readerToken: [ async ( {}, use ) => {
        const readerToken = await createToken(config.readerUsername, config.readerPassword)
        await use(readerToken)

    }, { scope: 'worker'} ],


    api: async({request, authToken}, use) => {
        const logger = new APILogger()
        setCustomExpectLogger(logger)
        const requestHandler = new RequestHandler(request, config.apiUrl, logger, authToken)
        await use(requestHandler)
    },
    config: async({}, use) => {
        await use(config)
    },

    // Deletes registered parts after the test, even when it fails; already-deleted parts are skipped.
    partCleanup: async({request, authToken}, use) => {
        const partPks: number[] = []
        await use({ register: (partPk: number) => { partPks.push(partPk) } })
        for (const partPk of partPks) await deletePart(request, config.apiUrl, authToken, partPk)
    }
})