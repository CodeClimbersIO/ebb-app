import { UserProfileRepo } from '../repos/UserProfile.js'
import type { StatusCount } from '../repos/UserProfile.js'

const getUserStatusCounts = async (): Promise<StatusCount[]> => {
  try {
    const statusCounts = await UserProfileRepo.getUserStatusCounts()
    
    // Add any business logic here if needed
    // For example, you could add default counts for missing statuses
    const allStatuses = ['online', 'offline', 'away', 'busy']
    const result: StatusCount[] = []
    
    for (const status of allStatuses) {
      const existing = statusCounts.find((sc: StatusCount) => sc.online_status === status)
      result.push({
        online_status: status,
        count: existing ? existing.count : 0
      })
    }
    
    return result
  } catch (error) {
    console.error('Service error fetching user status counts:', error)
    throw error
  }
}

export const UserProfileService = {
  getUserStatusCounts
} 
