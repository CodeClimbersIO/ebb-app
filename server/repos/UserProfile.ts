import { db } from '../config/database.js'

export interface UserProfile {
  id: number;
  user_id: string;
  online_status: 'online' | 'offline' | 'active' | 'flowing';
  created_at: Date;
  updated_at: Date;
}

export interface StatusCount {
  online_status: string;
  count: number;
}

const tableName = 'user_profile'


const getUserStatusCounts = async (): Promise<StatusCount[]> => {
  try {
    const result = await db(tableName)
      .select('online_status')
      .count('* as count')
      .groupBy('online_status')

    return result.map(row => ({
      online_status: row.online_status as string,
      count: parseInt(row.count as string)
    }))
  } catch (error) {
    console.error('Error fetching user status counts:', error)
    throw new Error('Failed to fetch user status counts')
  }
}

export const UserProfileRepo = {
  getUserStatusCounts
}
