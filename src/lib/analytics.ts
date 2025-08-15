import { default as posthog } from 'posthog-js'

export type AnalyticsEvent = 
  // Focus Session Events
  | 'start_focus_clicked'
  | 'end_early_clicked'
  | 'focus_session_completed'
  
  // Schedule Management Events
  | 'create_schedule_clicked'
  | 'edit_schedule_clicked'
  | 'delete_schedule_clicked'
  
  // Navigation Events
  | 'sidebar_nav_clicked'
  | 'top_nav_help_clicked'
  
  // Workflow Events
  | 'workflow_selected'
  | 'workflow_edited'
  | 'workflow_deleted'
  
  // Media Control Events
  | 'music_play_clicked'
  | 'music_pause_clicked'
  | 'music_next_clicked'
  | 'music_previous_clicked'
  
  // Upgrade/Pro Events
  | 'get_pro_clicked'
  | 'paywall_shown'

export interface AnalyticsEventProperties {
  // Focus session properties
  difficulty?: 'easy' | 'medium' | 'hard'
  session_duration?: number
  workflow_id?: string
  workflow_name?: string
  
  // Navigation properties
  destination?: string
  source?: string
  
  // Schedule properties
  schedule_type?: 'one_time' | 'recurring'
  recurrence_type?: 'daily' | 'weekly' | 'monthly'
  
  // General properties
  button_location?: string
  keyboard_shortcut_used?: boolean
  context?: string
}

const trackEvent = (
  event: AnalyticsEvent, 
  properties?: AnalyticsEventProperties
): void => {
  try {
    posthog.capture(event, {
      ...properties,
      timestamp: new Date().toISOString(),
      app_version: '0.4.7',
    })
  } catch (error) {
    console.warn('Failed to track analytics event:', event, error)
  }
}

export const AnalyticsService = {
  trackEvent,
}
