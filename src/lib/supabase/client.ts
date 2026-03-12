import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Log untuk debugging (hapus di production)
  console.log('Creating Supabase client with:', {
    url: supabaseUrl ? '✅ exists' : '❌ missing',
    key: supabaseAnonKey ? '✅ exists' : '❌ missing',
    urlValue: supabaseUrl?.substring(0, 20) + '...' // tampilkan sebagian
  })

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Check your .env.local file.'
    )
  }
  
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}