type OnOpenUrlHandler = (urls: string[]) => void | Promise<void>

let handler: OnOpenUrlHandler | null = null

export const onOpenUrl = (cb: OnOpenUrlHandler) => {
  handler = cb
}

;(window as unknown as Record<string, unknown>).__tauriMockOpenUrl = async (url: string) => {
  if (handler) await handler([url])
}

