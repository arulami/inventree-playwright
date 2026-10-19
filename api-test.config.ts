import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(__dirname, '.env')})


const processENV = process.env.TEST_ENV
const env = processENV || 'dev'

console.log('Test Environment is: ' + env)


const config = {

    baseUrl: 'https://demo.inventree.org',
    apiUrl: 'https://demo.inventree.org/api',
    username: process.env.INVENTREE_USERNAME as string,
    password: process.env.INVENTREE_PASSWORD as string,
    readerUsername: process.env.INVENTREE_READER_USERNAME as string,
    readerPassword: process.env.INVENTREE_READER_PASSWORD as string,
    stockUsername: process.env.INVENTREE_STOCK_USERNAME as string,
    stockPassword: process.env.INVENTREE_STOCK_PASSWORD as string
}

if(env === 'qa' || env === 'prod'){
    if( !process.env.INVENTREE_API_URL ){
        throw Error(`Missing required environment variable INVENTREE_API_URL for ${env}`)
    }
    config.apiUrl = process.env.INVENTREE_API_URL
    config.baseUrl = config.apiUrl.replace(/\/api\/?$/, '')
}

// Local InvenTree in Docker (e.g. the demo dataset loaded with `invoke dev.setup-test`); INVENTREE_BASE_URL overrides the default
if(env === 'local'){
    config.baseUrl = process.env.INVENTREE_BASE_URL || 'http://localhost'
    config.apiUrl = `${config.baseUrl}/api`
}

if( !config.username || !config.password || !config.readerUsername || !config.readerPassword || !config.stockUsername || !config.stockPassword ){
    throw Error(`Missing required environment variables: INVENTREE_USERNAME, INVENTREE_PASSWORD, INVENTREE_READER_USERNAME, INVENTREE_READER_PASSWORD, INVENTREE_STOCK_USERNAME, INVENTREE_STOCK_PASSWORD`)
}

export { config }
