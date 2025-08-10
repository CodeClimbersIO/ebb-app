type Session = { user: { id: string; email?: string } }

let session: Session | null = null

const auth = {
  async getSession() { return { data: { session } } },
  async signOut() { session = null; return { error: null } },
  async signInWithOAuth() { return { data: { url: 'http://localhost:1420/auth-success' }, error: null } },
  onAuthStateChange() {
    return { data: { subscription: { unsubscribe() {} } } }
  },
  async exchangeCodeForSession() { session = { user: { id: 'user-1', email: 'test@example.com' } }; return { data: { session }, error: null } },
}

const functions = {
  async invoke() { return { data: {}, error: null } },
}

const from = () => ({
  insert: () => ({ select: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) }),
  update: () => ({ eq: () => ({ select: () => ({ order: () => ({ limit: () => ({ data: [], error: null }) }) }) }) }),
  select: () => ({ data: [], error: null }),
})

export default {
  auth,
  functions,
  from,
}

