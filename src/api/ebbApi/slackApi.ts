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
      id: string
      team_name: string
      team_domain: string
      team_id?: string
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

const initiateOAuth = async (redirectType?: 'dev' | 'prod'): Promise<SlackAuthResponse['data']> => {
  const url = redirectType ? `/api/slack/auth?redirectType=${redirectType}` : '/api/slack/auth'
  const { data } = await platformApiRequest({
    url,
    method: 'GET'
  })
  return data as SlackAuthResponse['data']
}

const getStatus = async (): Promise<SlackStatusResponse['data']> => {
  const { data } = await platformApiRequest({
    url: '/api/slack/status',
    method: 'GET'
  })
  return data as SlackStatusResponse['data']
}

const updatePreferences = async (preferences: SlackPreferences): Promise<SlackPreferences> => {
  const { data } = await platformApiRequest({
    url: '/api/slack/preferences',
    method: 'PUT',  
    body: preferences
  })
  return data as SlackPreferences
}

const disconnect = async (teamId?: string): Promise<{success: boolean}> => {
  const url = teamId ? `/api/slack/disconnect/${teamId}` : '/api/slack/disconnect'
  const { success } = await platformApiRequest({
    url,
    method: 'DELETE'
  })
  return { success: success || false }
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
