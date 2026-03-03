import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabase: SupabaseClient | null = null

export function createClient() {
  if (typeof window === 'undefined') {
    throw new Error('createClient() hanya boleh dipanggil di browser')
  }

  if (!supabase) {
    supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  return supabase
}
