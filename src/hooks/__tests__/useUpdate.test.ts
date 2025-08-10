import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock FlowSessionApi to ensure no in-progress session blocks the update flow
vi.mock('@/api/ebbApi/flowSessionApi', () => ({
  FlowSessionApi: {
    getInProgressFlowSession: vi.fn().mockResolvedValue(null),
  },
}))

// Mock environment util to not be dev
vi.mock('@/lib/utils/environment.util', () => ({
  isDev: () => false,
}))

// Mock logger and process
vi.mock('@tauri-apps/plugin-log', async () => {
  const mod = await import('@/tests/mocks/tauri/log')
  return mod
})
vi.mock('@tauri-apps/plugin-process', async () => {
  const mod = await import('@/tests/mocks/tauri/process')
  return mod
})

// Updater event type subset used by our test
type UpdateEvent =
  | { event: 'Started'; data: { contentLength?: number | null } }
  | { event: 'Progress'; data: { chunkLength: number } }
  | { event: 'Finished' }

// Helper to build a fake update object compatible with our hook logic
const makeUpdate = (version: string) => ({
  version,
  date: new Date().toISOString(),
  body: `Release ${version}`,
  downloadAndInstall: vi.fn().mockImplementation(async (cb?: (ev: UpdateEvent) => void) => {
    cb?.({ event: 'Started', data: { contentLength: 100 } })
    cb?.({ event: 'Progress', data: { chunkLength: 50 } })
    cb?.({ event: 'Progress', data: { chunkLength: 50 } })
    cb?.({ event: 'Finished' })
  }),
})

// We will hot-swap the updater's check return value between calls
const checkMock = vi.fn()
vi.mock('@tauri-apps/plugin-updater', () => ({
  check: (...args: unknown[]) => checkMock(...args),
}))

// Mock toast and capture calls
const toastSuccess = vi.fn()
vi.mock('sonner', () => ({
  toast: { success: (...args: unknown[]) => toastSuccess(...args) },
}))

import { checkAndUpdate } from '@/hooks/useUpdate'

describe('useUpdate - toast replacement across sequential updates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('replaces the update toast when a new update becomes available', async () => {
    // First call returns v1, second call returns v2
    checkMock
      .mockResolvedValueOnce(makeUpdate('1.2.3'))
      .mockResolvedValueOnce(makeUpdate('1.2.4'))

    // Trigger first update
    await checkAndUpdate()
    expect(toastSuccess).toHaveBeenCalledTimes(1)
    expect(toastSuccess.mock.calls[0][0]).toContain('1.2.3')
    // Ensure a stable id is used so subsequent toasts replace the previous one
    expect(toastSuccess.mock.calls[0][1]).toMatchObject({ id: 'app-update', duration: Infinity })

    // Trigger second update
    await checkAndUpdate()
    expect(toastSuccess).toHaveBeenCalledTimes(2)
    expect(toastSuccess.mock.calls[1][0]).toContain('1.2.4')
    // Confirms same id used again, implying replacement behavior in Sonner
    expect(toastSuccess.mock.calls[1][1]).toMatchObject({ id: 'app-update', duration: Infinity })
  })
})

