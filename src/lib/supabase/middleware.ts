import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "./database.types";

/**
 * Manages Supabase authentication state and session cookie refresh in Next.js middleware.
 */
export async function updateSession(
  request: NextRequest,
  response: NextResponse = NextResponse.next({ request })
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      response,
      user: null,
      isAdmin: false,
    };
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.delete(name);
        response.cookies.set({ name, value: "", ...options, maxAge: 0 });
      },
    },
  });

  // Fetch the current authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;

  if (user) {
    // Check if this user is in the admins allowlist table
    const { data: adminRecord } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminRecord) {
      isAdmin = true;
    }
  }

  return { response, user, isAdmin };
}
