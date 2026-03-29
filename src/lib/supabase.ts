import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!_supabase) {
    _supabase = createClient(url, key);
  }

  return _supabase;
}

// For backwards compatibility - will be null if not configured
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) {
      throw new Error("Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.");
    }
    return Reflect.get(client, prop);
  },
});

export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}
