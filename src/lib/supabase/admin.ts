import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/**
 * Creates an administrative Supabase client using the secret service-role key.
 * 
 * SECURITY WARNING:
 * - This client bypasses Row Level Security (RLS).
 * - MUST NEVER be exposed to or imported in client-side code.
 * - Used exclusively for privileged server routes, admin draw procedures, and participant inserts.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("SECURITY VIOLATION: createAdminClient cannot be executed in the browser context.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase admin environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined."
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
