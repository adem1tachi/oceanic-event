import { NextRequest, NextResponse } from "next/server";
import { voteSchema } from "@/lib/validators";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = voteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid vote payload", details: validation.error.format() },
        { status: 400 }
      );
    }

    const { topicId } = validation.data;
    const supabase = createServerSupabaseClient();

    // Insert anonymous vote
    const { error } = await supabase.from("votes").insert({
      topic_id: topicId,
    });

    if (error) {
      console.error("[API Vote] Database error inserting vote:", error.message);
      return NextResponse.json(
        { error: "Failed to record vote" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[API Vote] Unexpected exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
