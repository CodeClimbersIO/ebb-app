import { Server } from 'http'
import app from '../../index'

let server: Server | null = null
const TEST_PORT = 3002 // Use different port for testing

export const startTestServer = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (server) {
      resolve()
      return
    }

    server = app.listen(TEST_PORT, (err?: Error) => {
      if (err) {
        reject(err)
      } else {
        console.log(`Test server started on port ${TEST_PORT}`)
        resolve()
      }
    })
  })
}

export const stopTestServer = (): Promise<void> => {
  return new Promise((resolve) => {
    if (server) {
      server.close(() => {
        server = null
        console.log('Test server stopped')
        resolve()
      })
    } else {
      resolve()
    }
  })
}

export const getTestServerUrl = () => `http://localhost:${TEST_PORT}`
export const getTestPort = () => TEST_PORT 
