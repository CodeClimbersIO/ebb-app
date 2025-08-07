# Claude AI Development Guide - React Frontend

This guide provides specific patterns and practices for working with the React frontend of this Tauri application.

## Overview

This is a React TypeScript frontend that communicates with a Rust backend via Tauri commands and manages both local SQLite databases and remote Supabase services.

## Data Access Architecture

### Three-Layer Data Pattern: Hooks → API → Repository

This application follows a strict three-layer architecture for data access:

**Layer 1: React Query Hooks (`src/api/hooks/`)**
- Contains React Query hooks that provide caching, background updates, and error handling
- Only layer components should import from
- Example: `useFlowSession.ts`

```typescript
import { useQuery } from '@tanstack/react-query'
import { FlowSessionApi } from '../ebbApi/flowSessionApi'

export const useGetMostRecentFlowSession = () => {
  return useQuery({
    queryKey: ['flowSession'],
    queryFn: () => FlowSessionApi.getMostRecentFlowSession(),
  })
}
```

**Layer 2: API Services (`src/api/ebbApi/`, `src/api/monitorApi/`)**
- Business logic layer that orchestrates data operations
- Calls repository functions and handles business rules
- Example: `flowSessionApi.ts`

```typescript
import { FlowSessionRepo } from '@/db/ebb/flowSessionRepo'

const startFlowSession = async (objective: string, type: 'smart' | 'manual') => {
  const inProgressSession = await FlowSessionRepo.getInProgressFlowSession()
  if (inProgressSession) throw new Error('Flow session already in progress')
  
  // Business logic here
  await FlowSessionRepo.createFlowSession(flowSession)
  return flowSession.id
}

export const FlowSessionApi = { startFlowSession, /* other methods */ }
```

**Layer 3: Repository Layer (`src/db/`)**
- Direct database access and SQL operations
- Contains only data access logic, no business rules
- Example: `flowSessionRepo.ts`

```typescript
import { getEbbDb } from './ebbDb'

const createFlowSession = async (flowSession: FlowSessionSchema) => {
  const ebbDb = await getEbbDb()
  return insert(ebbDb, 'flow_session', flowSession)
}

export const FlowSessionRepo = { createFlowSession, /* other methods */ }
```

**IMPORTANT: Always follow this data flow pattern:**
- Components → React Query Hooks → API Services → Repository Layer
- Never skip layers or access repositories directly from hooks
- Never call Tauri commands directly from hooks

### State Management Priority

**Use React Query First**: For any server or database state that can be cached and synchronized
**Use Zustand Stores Only When**: React Query cannot handle the use case, such as:
- UI state that doesn't come from a data source
- Transient application state
- Complex client-side computed state
- Event-driven state that needs to persist across route changes

```typescript
// ✅ Good: Server/database state with React Query
const { data: flowSessions } = useGetFlowSessions()

// ✅ Good: UI state with Zustand
const { isMenuOpen, toggleMenu } = useUIStore()

// ❌ Bad: Database state with Zustand
const { flowSessions, fetchFlowSessions } = useFlowSessionStore() // Don't do this
```

## Tauri Command Patterns

### Direct Command Invocation

Use the `invoke` function from `@tauri-apps/api/core` for system-level operations:

```typescript
import { invoke } from '@tauri-apps/api/core'

// App blocking commands
await invoke('start_blocking', { blockingApps, isBlockList })
await invoke('stop_blocking')

// System monitoring
await invoke('start_system_monitoring', { appHandle })
const isRunning = await invoke('is_monitoring_running')

// Permissions
const hasAccess = await invoke('check_accessibility_permissions')
```

### Available Tauri Commands

Key commands exposed by the Rust backend:

- **App Control**: `start_blocking`, `stop_blocking`, `snooze_blocking`
- **Monitoring**: `start_system_monitoring`, `is_monitoring_running`
- **Permissions**: `check_accessibility_permissions`, `request_system_permissions`
- **Notifications**: `show_notification`, `hide_notification`
- **Utilities**: `get_app_icon`, `detect_spotify`, `get_app_version`

## External API Communication

### Platform Request Pattern

Use `platformRequest.ts` for HTTP requests with automatic auth injection:

```typescript
import { request } from '../api/platformRequest'

const response = await request('POST', '/api/endpoint', {
  body: JSON.stringify(data),
  headers: { 'Content-Type': 'application/json' }
})
```

### Supabase Integration

Use direct Supabase client for remote operations:

```typescript
import { supabase } from '../lib/integrations/supabase'

const { data, error } = await supabase
  .from('devices')
  .select('*')
  .eq('user_id', userId)
```

## Database Access Patterns

### Local SQLite Databases

Two main databases:
- **EBB Database** (`src/db/ebb/`): Flow sessions, preferences, workflows
- **Monitor Database** (`src/db/monitor/`): Activity tracking, apps, tags

```typescript
// Always access through repository layer
import { FlowSessionRepo } from '../db/ebb/flowSessionRepo'
import { ActivityRepo } from '../db/monitor/activityRepo'

// Never access database directly in components or hooks
```

### Repository Method Examples

```typescript
// Create operations
await FlowSessionRepo.createFlowSession(sessionData)

// Read operations
const sessions = await FlowSessionRepo.getFlowSessions(limit)
const currentSession = await FlowSessionRepo.getInProgressFlowSession()

// Update operations
await FlowSessionRepo.updateFlowSession(id, updates)
```

## Event Handling

### Tauri Event Listeners

Listen to events from the Rust backend:

```typescript
import { EbbListen } from '../lib/ebbListen'

// Listen to specific events
const unlisten = await EbbListen.listen('event-name', (event) => {
  // Handle event
}, 'optional-scope')

// Cleanup
unlisten()
```

## Error Handling

### Centralized Error Management

Use the error utility for consistent error handling:

```typescript
import { logAndToastError } from '../lib/utils/ebbError.util'

try {
  // Operation
} catch (error) {
  logAndToastError('User-friendly error message', error)
}
```

## Component Patterns

### Page Components

Place page components in `src/pages/` following this structure:

```typescript
import { useEffect } from 'react'
import Layout from '../components/Layout'

export default function MyPage() {
  useEffect(() => {
    // Initialization logic
  }, [])

  return (
    <Layout>
      {/* Page content */}
    </Layout>
  )
}
```

### Data Fetching in Components

Always use React Query hooks:

```typescript
import { useGetFlowSessions } from '../api/hooks/useFlowSession'

export default function FlowSessionList() {
  const { data: sessions, isLoading, error } = useGetFlowSessions()
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error loading sessions</div>
  
  return (
    <div>
      {sessions?.map(session => (
        <div key={session.id}>{session.objective}</div>
      ))}
    </div>
  )
}
```

## File Organization

- `src/api/hooks/`: React Query hooks (Layer 1)
- `src/api/ebbApi/`: Business logic APIs (Layer 2)
- `src/api/monitorApi/`: System monitoring APIs (Layer 2)
- `src/db/`: Database repositories (Layer 3)
  - `ebb/`: Local app database
  - `monitor/`: Activity monitoring database
  - `supabase/`: Remote database
- `src/components/`: Reusable UI components
- `src/pages/`: Page-level components
- `src/hooks/`: Custom React hooks (non-data)
- `src/lib/stores/`: Zustand state stores (use sparingly)

## TypeScript Guidelines

- Always use proper typing for Tauri commands
- Define interfaces for all data structures in repository files
- Use generic types for repository patterns
- Leverage discriminated unions for state management

## Testing

Run tests with:
```bash
npm test
```

Test files should be placed alongside the code they test with `.test.ts` or `.test.tsx` extensions.


## Other preferences
files should always end with a newline character