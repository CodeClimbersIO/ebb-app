// Test environment setup
import { beforeAll } from 'bun:test'

beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = 'test'
  process.env.PORT = '3002'
  
  // Suppress console logs during tests (optional)
  if (process.env.SUPPRESS_TEST_LOGS === 'true') {
    console.log = () => {}
    console.warn = () => {}
  }
  
  // Set test database connection (if different from dev)
  // process.env.DB_NAME = 'codeclimbers_test';
  
  console.log('🧪 Test environment initialized')
})

export {} 
