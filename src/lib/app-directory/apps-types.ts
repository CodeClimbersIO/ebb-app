export type AppCategory = 
  | 'News' 
  | 'Social Media'
  | 'Entertainment'
  | 'Communication'
  | 'Gaming'
  | 'Shopping'
  | 'Travel'
  | 'Coding'
  | 'Designing'
  | 'Creating'
  | 'Utilities'

export const categoryEmojis: Record<AppCategory, string> = {
  'News': '📰',
  'Social Media': '📱',
  'Entertainment': '🎬',
  'Communication': '💬',
  'Gaming': '🎮',
  'Shopping': '🛍️',
  'Travel': '✈️',
  'Coding': '💻',
  'Designing': '🎨',
  'Creating': '🪄',
  'Utilities': '⚙️'
}

// Replace ActivityRating type with numeric scale
export type ActivityRating = 1 | 2 | 3 | 4 | 5
// 1 = High Consumption
// 2 = Consumption
// 3 = Neutral
// 4 = Creation
// 5 = High Creation

// Base interface for common properties
export interface BaseAppDefinition {
  category: AppCategory
  defaultRating: ActivityRating
  icon: string
}

// Website-specific interface
export interface WebsiteDefinition extends BaseAppDefinition {
  type: 'website'
  websiteUrl: string  // Required for websites
}

// Application-specific interface
export interface ApplicationDefinition extends BaseAppDefinition {
  type: 'application'
  name: string  // Required for applications
}

// Union type of both possibilities
export type AppDefinition = WebsiteDefinition | ApplicationDefinition
