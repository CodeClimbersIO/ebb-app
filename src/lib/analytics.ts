import { default as posthog } from 'posthog-js'
import { NotificationType } from '@/components/NotificationPanel/NotificationPanel'

export type AnalyticsEvent = 
  // Focus Session Events
  | 'start_focus_clicked'
  | 'end_early_clicked'
  | 'focus_session_completed'
  | 'add_time_clicked'
  | 'allow_list_clicked'
  | 'block_list_clicked'
  | 'focus_session_duration_selector_clicked'
  
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

  // Onboarding Events
  | 'accessibility_enabled'
  | 'shortcut_tutorial_completed'

  // Category Dashboard Events
  | 'date_picker_clicked'

  // Login Events
  | 'login_clicked'
  | 'login_skipped'

  // Slack Onboarding Events
  | 'slack_connect_clicked'
  | 'slack_connect_skipped'

  // Settings Page Events
  | 'delete_account_clicked'
  | 'delete_account_clicked_canceled'
  | 'delete_account_clicked_confirmed'

  // Integration Settings Events
  | 'spotify_disconnect_clicked'
  | 'spotify_connect_clicked'
  | 'slack_configure_clicked'
  | 'music_disconnect_clicked_canceled'
  | 'music_disconnect_clicked_confirmed'

  // Friends Analytics Events
  | 'offline_indicator_clicked'
  | 'connect_to_friends_clicked'
  | 'accept_friend_request_clicked'
  | 'decline_friend_request_clicked'
  | 'load_more_received_invites_clicked'
  | 'load_more_sent_invites_clicked'
  | 'invite_friends_clicked'
  | 'invite_friends_canceled'
  | 'invite_friends_sent'

  // Active Devices Settings Events
  | 'deactivate_device_clicked'

  // Mode Toggle Events
  | 'mode_toggle_clicked'

  // Notification Banner Events
  | 'notification_dismissed'
  | NotificationType

  // Range Mode Events
  | 'range_mode_selector_clicked'
  | 'range_mode_clicked'

  // Schedule Session Modal Events
  | 'schedule_session_modal_clicked'
  | 'schedule_session_modal_canceled'
  | 'schedule_session_modal_created'
  | 'schedule_session_modal_updated'
  | 'schedule_session_modal_deleted'

  // Customize Shortcut Events
  | 'shortcut_input_clicked'

  // Slack Focus Toggle Events
  | 'slack_focus_settings_save_clicked'
  | 'slack_focus_settings_more_settings_clicked'

  // Social Status Summary Events
  | 'connect_to_friends_clicked'

  // Top Nav Events
  | 'top_nav_feedback_clicked'
  | 'top_nav_start_focus_clicked'

  // Usage Summary Events
  | 'usage_summary_top_apps_clicked'

  // User Profile Settings Events
  | 'user_profile_settings_login_with_google_clicked'
  | 'user_profile_settings_manage_subscription_clicked'
  | 'user_profile_settings_logout_clicked'

  // Paywall Dialog Events
  | 'paywall_dialog_hard_clicked'

  // Difficulty Selector Events
  | 'difficulty_selector_clicked'

  // App Kanban Board Events
  | 'app_dragged'

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
  console.log('Tracking event:', event, properties)
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
