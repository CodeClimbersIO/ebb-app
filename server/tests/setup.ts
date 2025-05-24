// Test environment setup
import { beforeAll } from 'bun:test'

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.PORT = '3002'
  
  // Suppress console logs during tests for cleaner output
  // You can set SUPPRESS_TEST_LOGS=false to see logs if needed for debugging
  if (process.env.SUPPRESS_TEST_LOGS !== 'false') {
    console.log = () => {}
    console.warn = () => {}
    console.error = () => {} // This will suppress the service error logs
  }
  
  // Set test database connection (if different from dev)
  // process.env.DB_NAME = 'codeclimbers_test';
  
  if (process.env.SUPPRESS_TEST_LOGS !== 'false') {
    console.log('🧪 Test environment initialized (logs suppressed)')
  } else {
    console.log('🧪 Test environment initialized')
  }
})

export {} 
