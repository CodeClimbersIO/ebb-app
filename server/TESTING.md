# Testing Guide

This guide explains how to run and write tests for the CodeClimbers API server.

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── health.test.ts      # Health check endpoint tests
│   └── routes.test.ts      # General route behavior tests
├── unit/                   # Unit tests (for individual functions)
├── fixtures/               # Test data and fixtures
├── helpers/
│   └── testServer.ts       # Test server lifecycle management
└── setup.ts               # Global test setup
```

## Running Tests

### All Tests
```bash
bun test
```

### E2E Tests Only
```bash
bun test:e2e
# or
bun test tests/e2e/
```

### Specific Test File
```bash
bun test tests/e2e/health.test.ts
```

### Watch Mode (auto-rerun on changes)
```bash
bun test:watch
```

## Test Environment

### Environment Variables
Tests use a separate test environment with:
- `NODE_ENV=test`
- `PORT=3002` (different from dev server)
- Test database settings (when configured)

### Test Server
- Tests start a server on port 3002 automatically
- Server is started before each test suite and stopped after
- Uses the same app instance as production but on different port

## Current Test Coverage

### Health Check API (`/health`)
✅ **health.test.ts**
- Returns 200 status code
- Returns correct JSON structure
- Includes proper timestamp
- Returns correct content type
- Includes CORS headers
- Responds to OPTIONS requests

### General Routes
✅ **routes.test.ts**
- 404 handling for unknown routes
- 404 handling for unknown API routes
- Proper JSON content type for errors
- CORS preflight handling
- OPTIONS request handling

## Writing New Tests

### E2E Test Template

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';
import app from '../../index.js';
import { startTestServer, stopTestServer } from '../helpers/testServer.js';

describe('Feature Name', () => {
  beforeAll(async () => {
    await startTestServer();
  });

  afterAll(async () => {
    await stopTestServer();
  });

  describe('GET /endpoint', () => {
    it('should do something', async () => {
      const response = await request(app)
        .get('/endpoint')
        .expect(200);

      expect(response.body).toEqual({
        // expected response
      });
    });
  });
});
```

### Authentication Tests

For testing authenticated endpoints, you'll need to:

1. **Mock Authentication** (recommended for unit tests):
```typescript
// Mock the auth middleware
import { AuthMiddleware } from '../../middleware/auth.js';

// Mock successful authentication
const mockUser = { id: 'test-user-id', email: 'test@example.com' };
AuthMiddleware.authenticateToken = (req, res, next) => {
  req.user = mockUser;
  next();
};
```

2. **Use Real JWT Tokens** (for integration tests):
```typescript
// You'll need valid Supabase credentials for this
const token = 'valid-jwt-token-here';

const response = await request(app)
  .get('/api/users/status-counts')
  .set('Authorization', `Bearer ${token}`)
  .expect(200);
```

### Database Tests

When testing database operations:

1. **Use Test Database**: Set up separate test database
2. **Clean Data**: Reset database state between tests
3. **Fixtures**: Use test data fixtures for consistent testing

```typescript
// Example test with database cleanup
import { db } from '../../config/database.js';

describe('User Profile API', () => {
  beforeEach(async () => {
    // Clean database or insert test data
    await db('user_profile').del();
    await db('user_profile').insert([
      { user_id: 'test1', online_status: 'online' },
      { user_id: 'test2', online_status: 'offline' }
    ]);
  });

  afterAll(async () => {
    // Cleanup
    await db('user_profile').del();
  });

  // Your tests here
});
```

## Test Best Practices

### 1. Descriptive Test Names
```typescript
// Good
it('should return 401 when no authorization header is provided')

// Bad
it('should fail auth')
```

### 2. Arrange, Act, Assert Pattern
```typescript
it('should create user profile', async () => {
  // Arrange
  const userData = { user_id: 'test123', online_status: 'online' };
  
  // Act
  const response = await request(app)
    .post('/api/users/profile')
    .send(userData)
    .expect(201);
  
  // Assert
  expect(response.body.success).toBe(true);
  expect(response.body.data.user_id).toBe('test123');
});
```

### 3. Test Edge Cases
- Empty requests
- Invalid data formats
- Missing required fields
- Boundary values
- Error conditions

### 4. Independent Tests
- Each test should be able to run independently
- Don't rely on other tests to set up state
- Clean up after each test if needed

## Continuous Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: |
    cd server
    bun install
    bun test
```

## Debugging Tests

### Verbose Output
```bash
bun test --verbose
```

### Debugging Individual Tests
```bash
# Add console.log statements in tests
console.log('Response:', response.body);
```

### Server Logs During Tests
```bash
# Set environment variable to see server logs
SUPPRESS_TEST_LOGS=false bun test
```

## Next Steps

### Recommended Test Additions:

1. **Authentication Tests**
   - Valid JWT token acceptance
   - Invalid JWT token rejection
   - Missing token handling

2. **User Profile API Tests**
   - Status counts endpoint with auth
   - Database integration tests
   - Error handling tests

3. **Performance Tests**
   - Response time testing
   - Concurrent request handling
   - Memory usage monitoring

4. **Integration Tests**
   - Database connection tests
   - Supabase integration tests
   - Third-party service tests 