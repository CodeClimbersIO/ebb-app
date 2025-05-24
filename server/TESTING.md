# Testing Guide

This guide explains how to run and write tests for the CodeClimbers API server.

## Test Structure

```
tests/
├── e2e/                    # End-to-end tests
│   ├── health.test.ts      # Health check endpoint tests
│   ├── routes.test.ts      # General route behavior tests
│   └── users.test.ts       # Users API authentication tests
├── unit/                   # Unit tests (for individual functions)
│   └── userProfileService.test.ts  # UserProfileService business logic tests
├── fixtures/               # Test data and fixtures
├── helpers/
│   ├── testServer.ts       # Test server lifecycle management
│   └── authHelper.ts       # Authentication test utilities
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

### Unit Tests Only
```bash
bun test tests/unit/
```

### Specific Test File
```bash
bun test tests/e2e/health.test.ts
bun test tests/unit/userProfileService.test.ts
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

### Users API (`/api/users/status-counts`)
✅ **users.test.ts** - Authentication & Endpoint Tests
- **Authentication Required:**
  - Returns 401 when no authorization header provided
  - Returns 401 when authorization header is malformed
  - Returns 401 when token is invalid
  - Returns proper JSON content type for auth errors
  - Includes CORS headers even for auth errors
- **Endpoint Requirements:**
  - Verifies GET endpoint behavior
  - Verifies correct API path routing
- **Error Response Format:**
  - Consistent error response structure
- **CORS Behavior:**
  - Handles OPTIONS requests for preflight
  - Includes proper CORS headers

### UserProfileService Business Logic
✅ **userProfileService.test.ts** - Unit Tests
- **Status Counts Logic:**
  - Returns all 4 status types (online, offline, away, busy)
  - Includes missing status types with count 0
  - Handles empty repository responses
  - Preserves existing counts and adds missing ones
  - Propagates repository errors correctly
  - Returns results in consistent order

## Test Results Summary

```
✅ 25 tests passing
🔍 34 expect() assertions
📁 4 test files
⚡ ~750ms execution time
```

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

### Unit Test Template

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { ServiceName } from '../../services/ServiceName.js';
import { RepoName } from '../../repos/RepoName.js';

describe('ServiceName', () => {
  describe('methodName', () => {
    let originalMethod: typeof RepoName.methodName;

    beforeEach(() => {
      originalMethod = RepoName.methodName;
    });

    afterEach(() => {
      RepoName.methodName = originalMethod;
    });

    it('should do something', async () => {
      // Mock the repository
      RepoName.methodName = async () => mockData;

      const result = await ServiceName.methodName();
      
      expect(result).toEqual(expectedResult);
    });
  });
});
```

### Authentication Tests

For testing authenticated endpoints, we focus on authentication requirements rather than mocking:

```typescript
describe('Authentication Required', () => {
  it('should return 401 when no authorization header is provided', async () => {
    const response = await request(app)
      .get('/api/protected-endpoint')
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      error: 'Access token required'
    });
  });

  it('should return 401 when token is invalid', async () => {
    const response = await request(app)
      .get('/api/protected-endpoint')
      .set('Authorization', 'Bearer invalid_token')
      .expect(401);

    expect(response.body).toEqual({
      success: false,
      error: 'Invalid or expired token'
    });
  });
});
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

### 5. Unit vs E2E Testing Strategy
- **Unit Tests**: Test business logic in isolation (services, utilities)
- **E2E Tests**: Test HTTP endpoints, authentication, and integration behavior
- **Mock Dependencies**: Use mocks for external dependencies in unit tests

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

1. **Database Integration Tests**
   - UserProfile repository tests with real database
   - Database connection and migration tests

2. **More Authentication Scenarios**
   - Expired token handling
   - Different user roles and permissions
   - Token refresh scenarios

3. **Additional API Endpoints**
   - User profile CRUD operations
   - Status update endpoints
   - Error handling for various scenarios

4. **Performance Tests**
   - Response time testing
   - Concurrent request handling
   - Memory usage monitoring

5. **Integration Tests**
   - Supabase integration tests
   - Third-party service tests
   - End-to-end user workflows 