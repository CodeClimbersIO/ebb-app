class MockTray {
  id: string
  constructor(id: string) { this.id = id }
  async setTitle() {}
  async setIcon() {}
  async setIconAsTemplate() {}
  async setMenu() {}
}

const registry = new Map<string, MockTray>()

export class TrayIcon {
  static async getById(id: string) {
    return registry.get(id) || null
  }
  static async new(opts: { id: string }) {
    const t = new MockTray(opts.id)
    registry.set(opts.id, t)
    return t
  }
}

