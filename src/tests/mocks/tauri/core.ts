declare global {
  interface Window {
    __tauriMock?: { calls: Array<{ cmd: string; args: unknown }> }
    __tauriCoreMockLoaded?: boolean
  }
}

window.__tauriCoreMockLoaded = true

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const invoke = async (cmd: string, args?: unknown): Promise<any> => {
  if (!window.__tauriMock) window.__tauriMock = { calls: [] }
  window.__tauriMock.calls.push({ cmd, args })

  switch (cmd) {
  case 'start_blocking':
  case 'stop_blocking':
  case 'start_system_monitoring':
  case 'request_system_permissions':
  case 'check_accessibility_permissions':
  case 'show_notification':
  case 'hide_notification':
  case 'plugin:shell|open':
  case 'notify_start_flow':
  case 'notify_end_session':
  case 'notify_add_time_event':
  case 'notify_start_flow_with_workflow':
    return
  case 'is_monitoring_running':
    return false
  case 'generate_timer_icon':
    return new Uint8Array([0])
  default:
    return
  }
}

export const convertFileSrc = (p: string) => p

