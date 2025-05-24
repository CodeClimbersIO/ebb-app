import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

let supabase: SupabaseClient

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️  Supabase environment variables not set. Authentication will not work properly.')
  console.warn('   Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file')
  
  // Create a dummy client for development
  supabase = createClient(
    'https://dummy.supabase.co', 
    'dummy-key'
  )
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }
