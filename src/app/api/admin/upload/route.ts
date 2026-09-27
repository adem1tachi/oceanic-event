import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BUCKET_NAME = "topic-images";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(request: NextRequest) {
  try {
    // 1. Verify user authentication
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin privileges
    const { data: adminRecord } = await supabase
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!adminRecord) {
      return NextResponse.json({ error: "Forbidden: Admin privileges required" }, { status: 403 });
    }

    // 2. Extract and validate multipart file
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const topicSlug = (formData.get("topicSlug") as string) || "topic";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Supported: PNG, JPEG, WEBP, GIF, SVG." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB maximum limit." },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // 3. Ensure the storage bucket exists and is public
    try {
      const { data: buckets } = await adminSupabase.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

      if (!bucketExists) {
        await adminSupabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE,
          allowedMimeTypes: ALLOWED_MIME_TYPES,
        });
      }
    } catch (bucketErr) {
      console.warn("[Storage API] Bucket check/create notice:", bucketErr);
      // Continue attempt to upload in case bucket was created via SQL migrations
    }

    // 4. Generate unique filename
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const cleanSlug = topicSlug.replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `${cleanSlug}-${Date.now()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // 5. Upload file to Supabase Storage
    const { error: uploadError } = await adminSupabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Storage Upload Error]:", uploadError);
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // 6. Get public URL from Supabase CDN
    const {
      data: { publicUrl },
    } = adminSupabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
    });
  } catch (err: any) {
    console.error("[API Admin Upload Error]:", err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
