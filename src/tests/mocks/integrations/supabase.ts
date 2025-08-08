type Session = { user: { id: string; email?: string } }

let session: Session | null = null

const auth = {
  async getSession() { return { data: { session } } },
  async signOut() { session = null; return { error: null } },
  async signInWithOAuth() { return { data: { url: 'http://localhost:1420/auth-success' }, error: null } },
  onAuthStateChange(_cb: any) {
    return { data: { subscription: { unsubscribe() {} } } }
  },
  async exchangeCodeForSession(_code: string) { session = { user: { id: 'user-1', email: 'test@example.com' } }; return { data: { session }, error: null } },
}

const functions = {
  async invoke(_name: string, _args?: unknown) { return { data: {}, error: null } },
}

const from = (_table: string) => ({
  insert: (_v: any) => ({ select: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) }),
  update: (_v: any) => ({ eq: () => ({ select: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) }) }),
  select: () => ({ data: [], error: null }),
})

export default {
  auth,
  functions,
  from,
}

