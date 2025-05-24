import type { Request, Response, NextFunction } from 'express'
import { supabase } from '../config/supabase.js'

// Extend the Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        role?: string;
      };
    }
  }
}

const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      })
      return
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      })
      return
    }

    // Add user information to request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    }

    next()
  } catch (error) {
    console.error('Authentication error:', error)
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    })
  }
}



export const AuthMiddleware = {
  authenticateToken,
} 
