import type { Request, Response, NextFunction } from 'express'

export interface MockUser {
  id: string;
  email?: string;
  role?: string;
}

// Mock authentication middleware factory
export const createMockAuthMiddleware = (user: MockUser) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    req.user = user
    next()
  }
}

// Mock authentication failure middleware
export const createMockAuthFailureMiddleware = (errorMessage: string = 'Invalid or expired token') => {
  return async (req: Request, res: Response): Promise<void> => {
    res.status(401).json({
      success: false,
      error: errorMessage
    })
  }
}

// Default test user
export const testUser: MockUser = {
  id: 'test-user-123',
  email: 'test@example.com',
  role: 'user'
} 
