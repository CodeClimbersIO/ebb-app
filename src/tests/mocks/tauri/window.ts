import { listen, UnlistenFn } from './event'

type WindowListener = (event: { payload: unknown }) => void

class MockWindow {
  async show() {}
  async unminimize() {}
  async setFocus() {}
  async close() {}
  async destroy() {}
  async listen(name: string, cb: WindowListener): Promise<UnlistenFn> {
    return listen(name, cb)
  }
}

export const getCurrentWindow = () => new MockWindow()
export class Window {
  static getCurrent() {
    return getCurrentWindow()
  }
}

