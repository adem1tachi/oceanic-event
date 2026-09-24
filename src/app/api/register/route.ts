import { NextRequest, NextResponse } from "next/server";
import { registrationSchema } from "@/lib/validators";
import { normalizeAlgerianPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // 1. Server-side Zod validation
    const validation = registrationSchema.safeParse(body);

    if (!validation.success) {
      const errorMap: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        errorMap[String(issue.path[0])] = issue.message;
      }
      return NextResponse.json(
        { error: "Validation failed", errors: errorMap },
        { status: 400 }
      );
    }

    const { fullName, phone, email, consent, locale, botField } = validation.data;

    // 2. Honeypot Bot Detection
    if (botField && botField.length > 0) {
      console.warn("[API Register] Bot honeypot triggered by IP/client");
      // Silently accept or return 400 to deter bot scrapers
      return NextResponse.json(
        { error: "Submission rejected" },
        { status: 400 }
      );
    }

    // 3. Phone Normalization (Double check canonical E.164 format)
    const phoneResult = normalizeAlgerianPhone(phone);
    if (!phoneResult.isValid || !phoneResult.normalized) {
      return NextResponse.json(
        {
          error: "Invalid Algerian phone number",
          errors: { phone: "validation.phone_invalid_algerian" },
        },
        { status: 400 }
      );
    }

    const canonicalPhone = phoneResult.normalized;

    // 4. Server-side insert using privileged admin client (Service Role)
    const adminSupabase = createAdminClient();

    const { data, error } = await adminSupabase
      .from("participants")
      .insert({
        full_name: fullName.trim(),
        phone: canonicalPhone,
        email: email && email.trim().length > 0 ? email.trim().toLowerCase() : null,
        consent: Boolean(consent),
        locale: locale || "en",
      })
      .select("id")
      .single();

    if (error) {
      // Check for Postgres unique constraint violation on phone (error code 23505)
      if (
        error.code === "23505" ||
        error.message.includes("participants_phone_key") ||
        error.message.includes("unique constraint")
      ) {
        return NextResponse.json(
          {
            code: "DUPLICATE_PHONE",
            error: "This phone number is already registered for today's draw.",
          },
          { status: 409 }
        );
      }

      console.error("[API Register] Database insertion error:", error.message);
      return NextResponse.json(
        { error: "Failed to save registration" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, participantId: data.id },
      { status: 201 }
    );
  } catch (err) {
    console.error("[API Register] Server exception:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
