// IMPORTANT: never expose service key to client. Use only within Route Handlers.
import { createClient } from "@supabase/supabase-js"

let adminClient: ReturnType<typeof createClient> | null = null

export function getSupabaseAdminClient() {
  if (adminClient) return adminClient
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
  }
  
  adminClient = createClient(url, serviceRoleKey, { auth: { persistSession: false } })
  return adminClient
}
