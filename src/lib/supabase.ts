import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || "https://ocrddgvdjogploplbblw.supabase.co";
const key = process.env.SUPABASE_ANON_KEY || "sb_publishable_a0PiaTKOJoM0m8q8PckJjA_1eaoZGj3";

export function getSupabase() {
  if (!url || !key) return null;
  return createClient(url, key);
}
