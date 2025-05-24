import { Router } from 'express'
import type { Request, Response } from 'express'
import { UserProfileService } from '../services/UserProfileService.js'
import { AuthMiddleware } from '../middleware/auth.js'

const router = Router()

const getStatusCounts = async (req: Request, res: Response): Promise<void> => {
  try {
    // Now we have access to req.user.id from the auth middleware
    console.log('Authenticated user:', req.user?.id)
    
    const statusCounts = await UserProfileService.getUserStatusCounts()
    res.json({
      success: true,
      data: statusCounts
    })
  } catch (error) {
    console.error('Controller error fetching status counts:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch status counts'
    })
  }
}

// Initialize routes with authentication middleware
router.get('/status-counts', AuthMiddleware.authenticateToken, getStatusCounts)

export const UserController = {
  router,
  getStatusCounts
} 
