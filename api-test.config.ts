import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(__dirname, '.env')})


const processENV = process.env.TEST_ENV
const env = processENV || 'dev'

console.log('Test Environment is: ' + env)


const config = {

    apiUrl: 'https://demo.inventree.org/api',
    username: process.env.INVENTREE_USERNAME as string,
    password: process.env.INVENTREE_PASSWORD as string,
    readerUsername: process.env.INVENTREE_READER_USERNAME as string,
    readerPassword: process.env.INVENTREE_READER_PASSWORD as string
}

if(env === 'qa' || env === 'prod'){
    if( !process.env.INVENTREE_API_URL ){
        throw Error(`Missing required environment variable INVENTREE_API_URL for ${env}`)
    }
    config.apiUrl = process.env.INVENTREE_API_URL
}

if( !config.username || !config.password || !config.readerUsername || !config.readerPassword ){
    throw Error(`Missing required environment variables: INVENTREE_USERNAME, INVENTREE_PASSWORD, INVENTREE_READER_USERNAME, INVENTREE_READER_PASSWORD`)
}

export { config }
