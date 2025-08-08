export type UnlistenFn = () => void
type Callback = (event: { payload: unknown }) => void

const listeners = new Map<string, Set<Callback>>()

export const listen = async (name: string, cb: Callback): Promise<UnlistenFn> => {
  if (!listeners.has(name)) listeners.set(name, new Set())
  listeners.get(name)!.add(cb)
  return () => listeners.get(name)!.delete(cb)
}

export const emit = async (name: string, payload?: unknown) => {
  listeners.get(name)?.forEach((cb) => cb({ payload }))
}

;(window as any).__tauriMockEmit = (name: string, payload?: unknown) => emit(name, payload)

