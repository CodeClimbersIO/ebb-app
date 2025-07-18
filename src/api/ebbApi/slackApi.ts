import { platformApiRequest } from '../platformRequest'

export interface SlackAuthResponse {
  success: boolean
  data?: {
    authUrl: string
  }
  error?: string
}

export interface SlackStatusResponse {
  success: boolean
  data?: {
    connected: boolean
    workspaces: Array<{
      team_name: string
      team_domain: string
      created_at: string
    }>
    preferences: {
      enabled: boolean
      auto_status_update: boolean
      auto_dnd: boolean
      custom_status_text: string
      custom_status_emoji: string
      auto_reply_enabled: boolean
      auto_reply_message: string
      urgent_keywords: string[]
    }
  }
  error?: string
}

export interface SlackPreferences {
  enabled?: boolean
  auto_status_update?: boolean
  auto_dnd?: boolean
  custom_status_text?: string
  custom_status_emoji?: string
  auto_reply_enabled?: boolean
  auto_reply_message?: string
  urgent_keywords?: string[]
}

const initiateOAuth = async (): Promise<SlackAuthResponse['data']> => {
  return await platformApiRequest({
    url: '/api/slack/auth',
    method: 'GET'
  })
}

const getStatus = async (): Promise<SlackStatusResponse['data']> => {
  return await platformApiRequest({
    url: '/api/slack/status',
    method: 'GET'
  })
}

const updatePreferences = async (preferences: SlackPreferences): Promise<{ success: boolean; data?: SlackPreferences; error?: string }> => {
  return platformApiRequest({
    url: '/api/slack/preferences',
    method: 'PUT',
    body: preferences
  })
}

const disconnect = async (teamId?: string): Promise<{ success: boolean; message?: string; error?: string }> => {
  const url = teamId ? `/api/slack/disconnect/${teamId}` : '/api/slack/disconnect'
  return platformApiRequest({
    url,
    method: 'DELETE'
  })
}

const startFocusSession = async (sessionId?: string, durationMinutes: number = 25) => {
  return await platformApiRequest({
    url: '/api/slack/focus-session/start',
    method: 'POST',
    body: { sessionId, durationMinutes }
  })
}

const endFocusSession = async (sessionId?: string) => {
  return await platformApiRequest({
    url: '/api/slack/focus-session/end',
    method: 'POST',
    body: { sessionId }
  })
}

const setCustomStatus = async (statusText: string, statusEmoji?: string, expiration?: number) => {
  return await platformApiRequest({
    url: '/api/slack/status/set',
    method: 'POST',
    body: { statusText, statusEmoji, expiration }
  })
}

const clearStatus = async () => {
  return await platformApiRequest({
    url: '/api/slack/status/clear',
    method: 'POST'
  })
}

const controlDND = async (action: 'enable' | 'disable', durationMinutes?: number) => {
  return await platformApiRequest({
    url: '/api/slack/dnd',
    method: 'POST',
    body: { action, durationMinutes }
  })
}

const getDNDInfo = async () => {
  return await platformApiRequest({
    url: '/api/slack/dnd',
    method: 'GET'
  })
}

export const slackApi = {
  initiateOAuth,
  getStatus,
  updatePreferences,
  disconnect,
  startFocusSession,
  endFocusSession,
  setCustomStatus,
  clearStatus,
  controlDND,
  getDNDInfo,
}
