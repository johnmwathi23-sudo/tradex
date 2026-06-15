import { createClient, SupabaseClient } from "@supabase/supabase-js"

let client: SupabaseClient | null = null

function getAdminClient(): SupabaseClient {
  if (!client) {
    client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return client
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return getAdminClient()[prop as keyof SupabaseClient]
  },
})
