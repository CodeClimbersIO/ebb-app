import { Router } from 'express'
import type { Request, Response } from 'express'
import { UserProfileService } from '../services/UserProfileService.js'

const router = Router()

const getStatusCounts = async (req: Request, res: Response): Promise<void> => {
  try {
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

// Initialize routes
router.get('/status-counts', getStatusCounts)

export const UserController = {
  router,
  getStatusCounts
} 
