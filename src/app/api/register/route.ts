import { NextRequest, NextResponse } from "next/server";
import { registrationSchema } from "@/lib/validators";
import { normalizeAlgerianPhone } from "@/lib/phone";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 0. IP-based Rate Limiting (max 10 registration submissions per 10 minutes per IP)
    const clientIp = getClientIp(request.headers);
    const rateLimit = checkRateLimit(`register:${clientIp}`, 10, 10 * 60 * 1000);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "تم تجاوز الحد الأقصى للمحاولات، يرجى المحاولة بعد قليل",
          code: "RATE_LIMITED",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "600",
          },
        }
      );
    }

    const adminSupabase = createAdminClient();

    // Verify registration status from database
    const { data: settingsData } = await adminSupabase
      .from("app_settings")
      .select("is_registration_open")
      .eq("id", 1)
      .maybeSingle();

    if (settingsData && settingsData.is_registration_open === false) {
      return NextResponse.json(
        {
          error: "تم إغلاق استمارة التسجيل حالياً",
          code: "REGISTRATION_CLOSED",
        },
        { status: 403 }
      );
    }

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

    const {
      firstName,
      lastName,
      position,
      company,
      whatsapp,
      desiredTopic,
      peopleCount,
      fullName,
      phone,
      email,
      consent,
      locale,
      botField,
    } = validation.data;

    // 2. Honeypot Bot Detection
    if (botField && botField.length > 0) {
      console.warn("[API Register] Bot honeypot triggered by IP/client");
      return NextResponse.json(
        { error: "Submission rejected" },
        { status: 400 }
      );
    }

    // 3. Phone / WhatsApp Normalization (Double check canonical E.164 format)
    const rawPhone = whatsapp || phone || "";
    const phoneResult = normalizeAlgerianPhone(rawPhone);
    if (!phoneResult.isValid || !phoneResult.normalized) {
      return NextResponse.json(
        {
          error: "Invalid Algerian phone number",
          errors: {
            [whatsapp ? "whatsapp" : "phone"]: "validation.phone_invalid_algerian",
          },
        },
        { status: 400 }
      );
    }

    const canonicalPhone = phoneResult.normalized;
    const derivedFullName = (
      fullName ||
      [firstName, lastName].filter(Boolean).join(" ") ||
      "Visitor"
    ).trim();

    // 4. Server-side insert using privileged admin client (Service Role)
    // Primary attempt: Insert with extended fields
    let insertResult = await adminSupabase
      .from("participants")
      .insert({
        full_name: derivedFullName,
        phone: canonicalPhone,
        email: email && email.trim().length > 0 ? email.trim().toLowerCase() : null,
        first_name: firstName?.trim() || null,
        last_name: lastName?.trim() || null,
        position: position?.trim() || null,
        company: company?.trim() || null,
        desired_topic: desiredTopic?.trim() || null,
        people_count: peopleCount || 1,
        consent: Boolean(consent),
        locale: locale || "en",
      })
      .select("id")
      .single();

    // Resilient fallback if custom columns are not yet in the DB schema cache
    if (
      insertResult.error &&
      (insertResult.error.code === "PGRST204" ||
        insertResult.error.message.includes("Could not find the"))
    ) {
      const fallbackDetails = [
        company ? `Org: ${company}` : "",
        position ? `Pos: ${position}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const fallbackName = fallbackDetails
        ? `${derivedFullName} (${fallbackDetails})`
        : derivedFullName;

      const fallbackEmail = desiredTopic
        ? `Topic: ${desiredTopic} (x${peopleCount || 1})`
        : email || null;

      insertResult = await adminSupabase
        .from("participants")
        .insert({
          full_name: fallbackName,
          phone: canonicalPhone,
          email: fallbackEmail,
          consent: Boolean(consent),
          locale: locale || "en",
        })
        .select("id")
        .single();
    }

    if (insertResult.error) {
      // Check for Postgres unique constraint violation on phone (error code 23505)
      if (
        insertResult.error.code === "23505" ||
        insertResult.error.message.includes("participants_phone_key") ||
        insertResult.error.message.includes("unique constraint")
      ) {
        return NextResponse.json(
          {
            code: "DUPLICATE_PHONE",
            error: "This phone number is already registered for today's draw.",
          },
          { status: 409 }
        );
      }

      console.error("[API Register] Database insertion error:", insertResult.error.message);
      return NextResponse.json(
        { error: "Failed to save registration" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        participantId: insertResult.data.id,
        participant: {
          firstName: firstName || derivedFullName,
          lastName: lastName || "",
          position: position || "",
          company: company || "",
          whatsapp: canonicalPhone,
          desiredTopic: desiredTopic || null,
          peopleCount: peopleCount || 1,
        },
      },
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
