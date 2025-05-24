# Authentication Guide

This guide explains how to set up and use Supabase JWT authentication with the CodeClimbers API.

## Setup

### 1. Environment Variables

Create a `.env` file in the server directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=codeclimbers

# Server Configuration
PORT=3001

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_JWT_SECRET=your_jwt_secret_here
```

### 2. Get Supabase Credentials

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to Settings > API
4. Copy the following:
   - **Project URL** → `SUPABASE_URL`
   - **anon public** key → `SUPABASE_ANON_KEY`
   - **JWT Secret** → `SUPABASE_JWT_SECRET`

## How Authentication Works

### 1. Token Validation

The middleware validates JWT tokens in two ways:

#### Method 1: Supabase API Validation (Recommended)
```typescript
// Uses supabase.auth.getUser(token)
router.get('/endpoint', AuthMiddleware.authenticateToken, handler);
```

#### Method 2: Local JWT Validation (Faster)
```typescript
// Uses local JWT verification with SUPABASE_JWT_SECRET
router.get('/endpoint', AuthMiddleware.authenticateTokenLocal, handler);
```

### 2. Request Flow

1. Client sends request with `Authorization: Bearer <jwt_token>`
2. Middleware extracts and validates the token
3. If valid, adds user info to `req.user`:
   ```typescript
   req.user = {
     id: string;      // Supabase user ID
     email?: string;  // User email
     role?: string;   // User role
   }
   ```
4. Request continues to the route handler
5. If invalid, returns 401 Unauthorized

## Testing Authentication

### 1. Without Authentication (Should Fail)

```bash
curl http://localhost:3001/api/users/status-counts
```

Expected response:
```json
{
  "success": false,
  "error": "Access token required"
}
```

### 2. With Invalid Token (Should Fail)

```bash
curl -H "Authorization: Bearer invalid_token" \
     http://localhost:3001/api/users/status-counts
```

Expected response:
```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

### 3. With Valid Token (Should Succeed)

First, get a valid JWT token from your Supabase client:

```javascript
// In your frontend application
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Sign in user
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Get the access token
const token = data.session?.access_token
```

Then use the token:

```bash
curl -H "Authorization: Bearer YOUR_ACTUAL_JWT_TOKEN" \
     http://localhost:3001/api/users/status-counts
```

Expected response:
```json
{
  "success": true,
  "data": [
    { "online_status": "online", "count": 5 },
    { "online_status": "offline", "count": 10 },
    { "online_status": "away", "count": 2 },
    { "online_status": "busy", "count": 1 }
  ]
}
```

## Development Mode

If you don't have Supabase credentials set up yet, the server will still run but show warnings:

```
⚠️  Supabase environment variables not set. Authentication will not work properly.
   Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file
```

In this mode, all authenticated requests will fail with 401 errors until you configure Supabase properly.

## Adding Authentication to New Routes

To protect a new route with authentication:

```typescript
import { AuthMiddleware } from '../middleware/auth.js';

// Protected route
router.get('/protected-endpoint', AuthMiddleware.authenticateToken, (req, res) => {
  // Access user info
  const userId = req.user?.id;
  const userEmail = req.user?.email;
  
  // Your route logic here
});

// Unprotected route (no middleware)
router.get('/public-endpoint', (req, res) => {
  // No authentication required
});
```

## Error Handling

The middleware handles these error cases:

- **No Authorization header**: `"Access token required"`
- **Invalid token format**: `"Access token required"`
- **Expired token**: `"Invalid or expired token"`
- **Invalid signature**: `"Invalid or expired token"`
- **Supabase API error**: `"Authentication failed"`

All errors return HTTP 401 Unauthorized with a consistent JSON response format. 