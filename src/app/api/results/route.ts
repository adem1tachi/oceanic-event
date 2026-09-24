import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Query the public vote_counts view
    const { data, error } = await supabase
      .from("vote_counts")
      .select("topic_id, topic_slug, topic_position, count")
      .order("topic_position", { ascending: true });

    if (error) {
      console.error("[API Results] Error querying vote_counts:", error.message);
      return NextResponse.json(
        { error: "Could not fetch vote counts" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { results: data || [] },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err) {
    console.error("[API Results] Unexpected exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
