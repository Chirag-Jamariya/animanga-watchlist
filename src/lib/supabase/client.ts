import { createBrowserClient } from "@supabase/ssr"

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !anon) {
    // Avoid crashing client; UI will surface friendly message.
    console.warn("[v0] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
    // Return a mock client that prevents crashes
    return {
      channel: () => ({
        on: () => ({ subscribe: () => {} }),
        subscribe: () => {},
      }),
      removeChannel: () => {},
    } as any
  }
  
  browserClient = createBrowserClient(url, anon)
  return browserClient
}
