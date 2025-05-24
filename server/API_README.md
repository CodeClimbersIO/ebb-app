# CodeClimbers API Server

A layered Express.js API server built with Bun.js, TypeScript, and PostgreSQL.

## Architecture

The server follows a clean layered architecture with module-based exports:

- **Controllers** (`/controllers`): Handle HTTP requests and responses - export router and handler functions
- **Services** (`/services`): Business logic layer - export named functions grouped in objects
- **Repositories** (`/repos`): Data access layer - export named functions grouped in objects
- **Config** (`/config`): Configuration modules

## Getting Started

### Prerequisites

- Bun.js installed
- PostgreSQL database running
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

## API Endpoints

### Health Check
- **GET** `/health` - Server health status

### Users API

Base URL: `/api/users`

#### Get Status Counts
- **GET** `/status-counts`
- Returns count of users by online status
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

## Project Structure

```
server/
├── config/
│   └── database.ts          # Database connection configuration
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

const router = Router();

const handlerFunction = async (req: Request, res: Response) => {
  // implementation
};

router.get('/endpoint', handlerFunction);

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
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

## Development

The server uses TypeScript with strict type checking and follows clean architecture principles with module-based exports. Each layer has a single responsibility:

- **Controllers**: Handle HTTP concerns (request/response) with exported router and functions
- **Services**: Implement business logic and validation as named function exports
- **Repositories**: Manage database operations as named function exports

This module-based separation makes the code maintainable, testable, and scalable without the overhead of classes. 