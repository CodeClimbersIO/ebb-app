import express, { json, urlencoded } from 'express'
import { UserController } from './controllers/UserController.js'

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

// Middleware
app.use(json())
app.use(urlencoded({ extended: true }))

// CORS middleware (basic setup)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
  } else {
    next()
  }
})

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'CodeClimbers API'
  })
})

// API Routes (protected by authentication middleware)
app.use('/api/users', UserController.router)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  })
})

// Error handler
app.use((err: Error, req: express.Request, res: express.Response) => {
  console.error('Unhandled error:', err)
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  })
})

// Function to start the server
export const startServer = (port: number = PORT) => {
  return app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`)
    console.log(`📊 Health check: http://localhost:${port}/health`)
    console.log(`👥 Users API (auth required): http://localhost:${port}/api/users`)
    console.log('🔐 Authentication: Supabase JWT required for /api routes')
  })
}

// Auto-start server only when this file is run directly
if (import.meta.main) {
  startServer()
}

export default app
