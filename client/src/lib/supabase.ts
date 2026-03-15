// server/lib/supabase.ts
// Server-side Supabase client using the SERVICE ROLE key.
// This bypasses Row Level Security and is for server use ONLY.
// Never expose SUPABASE_SERVICE_ROLE_KEY to the frontend.
import { createClient } from "@supabase/supabase-js";
 
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);