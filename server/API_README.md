# CodeClimbers API Server

A layered Express.js API server built with Bun.js, TypeScript, PostgreSQL, and Supabase authentication.

## Architecture

The server follows a clean layered architecture with module-based exports:

- **Controllers** (`/controllers`): Handle HTTP requests and responses - export router and handler functions
- **Services** (`/services`): Business logic layer - export named functions grouped in objects
- **Repositories** (`/repos`): Data access layer - export named functions grouped in objects
- **Config** (`/config`): Configuration modules
- **Middleware** (`/middleware`): Authentication and other middleware

## Getting Started

### Prerequisites

- Bun.js installed
- PostgreSQL database running
- Supabase project set up
- Node.js (for TypeScript support)

### Installation

```bash
bun install
```

### Environment Variables

Create a `.env` file with the following variables:

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
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
```

### Database Setup

Make sure you have a PostgreSQL database with a `user_profile` table:

```sql
CREATE TABLE user_profile (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  online_status VARCHAR(20) DEFAULT 'offline' CHECK (online_status IN ('online', 'offline', 'away', 'busy')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Running the Server

Development mode (with auto-reload):
```bash
bun run dev
```

Production mode:
```bash
bun run start
```

## Authentication

The API uses Supabase JWT authentication. All `/api` routes require a valid JWT token.

### How to authenticate:

1. Include the JWT token in the Authorization header:
   ```
   Authorization: Bearer <your_jwt_token>
   ```

2. The middleware will validate the token and add user information to `req.user`:
   ```typescript
   req.user = {
     id: string;      // Supabase user ID
     email?: string;  // User email
     role?: string;   // User role
   }
   ```

### Authentication Methods:

- **`authenticateToken`**: Validates token by calling Supabase API (recommended for production)
- **`authenticateTokenLocal`**: Validates token locally using JWT secret (faster, requires SUPABASE_JWT_SECRET)

## API Endpoints

### Health Check
- **GET** `/health` - Server health status (no auth required)

### Users API

Base URL: `/api/users` (🔐 **Authentication required**)

#### Get Status Counts
- **GET** `/status-counts`
- Returns count of users by online status
- **Headers**: `Authorization: Bearer <jwt_token>`
- Response:
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

#### Get User Profile
- **GET** `/:userId/profile`
- Returns user profile information
- Response:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "user_id": "user123",
    "online_status": "online",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Update User Status
- **PATCH** `/:userId/status`
- Updates user's online status
- Request body:
```json
{
  "status": "online" // "online" | "offline" | "away" | "busy"
}
```
- Response:
```json
{
  "success": true,
  "message": "User status updated successfully"
}
```

### Authentication Errors

```json
{
  "success": false,
  "error": "Access token required"
}
```

```json
{
  "success": false,
  "error": "Invalid or expired token"
}
```

## Project Structure

```
server/
├── config/
│   ├── database.ts          # Database connection configuration
│   └── supabase.ts          # Supabase client configuration
├── middleware/
│   └── auth.ts              # Authentication middleware
├── controllers/
│   └── UserController.ts    # User-related HTTP endpoints (module-based)
├── services/
│   └── UserProfileService.ts # Business logic for user profiles (module-based)
├── repos/
│   └── UserProfile.ts       # Database access for user_profile table (module-based)
├── index.ts                 # Main server file
└── package.json
```

## Module Architecture

Each layer uses a consistent module-based pattern:

### Controllers
```typescript
import { Router } from 'express';
import { AuthMiddleware } from '../middleware/auth.js';

const router = Router();

const handlerFunction = async (req: Request, res: Response) => {
  // Access authenticated user: req.user.id
  // implementation
};

router.get('/endpoint', AuthMiddleware.authenticateToken, handlerFunction);

export const ControllerName = {
  router,
  handlerFunction
};
```

### Services
```typescript
const functionName = async (): Promise<ReturnType> => {
  // business logic
};

export const ServiceName = {
  functionName
};
```

### Repositories  
```typescript
const functionName = async (): Promise<ReturnType> => {
  // database operations
};

export const RepoName = {
  functionName
};
```

### Middleware
```typescript
const middlewareFunction = async (req: Request, res: Response, next: NextFunction) => {
  // middleware logic
  next();
};

export const MiddlewareName = {
  middlewareFunction
};
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (invalid or missing token)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Development

The server uses TypeScript with strict type checking and follows clean architecture principles with module-based exports. Each layer has a single responsibility:

- **Controllers**: Handle HTTP concerns (request/response) with exported router and functions
- **Services**: Implement business logic and validation as named function exports
- **Repositories**: Manage database operations as named function exports
- **Middleware**: Handle cross-cutting concerns like authentication

This module-based separation makes the code maintainable, testable, and scalable without the overhead of classes.

## Security Notes

- JWT tokens are validated on every request to protected routes
- User information is automatically added to the request object after successful authentication
- The `/health` endpoint is intentionally unprotected for monitoring purposes
- CORS is configured to allow all origins (adjust for production) 