declare global {
  interface Window {
    __tauriMock?: { calls: Array<{ cmd: string; args: unknown }> }
  }
}

export const open = async (url: string) => {
  if (!window.__tauriMock) window.__tauriMock = { calls: [] }
  window.__tauriMock.calls.push({ cmd: 'plugin:shell|open', args: { path: url } })
}

