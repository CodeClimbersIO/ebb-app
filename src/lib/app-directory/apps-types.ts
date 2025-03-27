export type AppCategory = 
'communication' |
'entertainment' |
'shopping' |
'gaming' |
'social media' |
'news' |
'designing' |
'travel' |
'coding' |
'learning' |
'data/analytics' |
'ai' |
'music/sound' |
'photo/video' |
'browser' |
'writing' |
'utilities'


export const categoryEmojis: Record<AppCategory, string> = {
  'news': '📰',
  'social media': '👤',
  'entertainment': '🎬',
  'communication': '💬',
  'gaming': '🎮',
  'shopping': '🛍️',
  'travel': '✈️',
  'coding': '💻',
  'designing': '🎨',
  'utilities': '⚙️',
  'learning': '📚',
  'data/analytics': '📊',
  'ai': '🤖',
  'music/sound': '🎶',
  'photo/video': '📸',
  'browser': '🌐',
  'writing': '✏️'
}

export type ActivityRating = 1 | 2 | 3 | 4 | 5

export interface BaseAppDefinition {
  category: AppCategory
  defaultRating: ActivityRating
  icon: string
}

export interface WebsiteDefinition extends BaseAppDefinition {
  type: 'website'
  websiteUrl: string  // Required for websites
}

export interface ApplicationDefinition extends BaseAppDefinition {
  type: 'application'
  name: string  // Required for applications
}

export type AppDefinition = WebsiteDefinition | ApplicationDefinition
