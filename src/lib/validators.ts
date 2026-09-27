import { z } from "zod";
import { normalizeAlgerianPhone } from "./phone";

/**
 * Registration form validation schema for both client-side and server-side verification.
 * Supports the complete Visitor form (First Name, Last Name, Position, Company, WhatsApp, etc.)
 * as well as legacy/direct registrations.
 */
export const registrationSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .max(60, { message: "validation.name_max" })
      .refine((val) => !val || !/[<>{}]/g.test(val), {
        message: "validation.name_invalid_chars",
      })
      .optional(),

    lastName: z
      .string()
      .trim()
      .max(60, { message: "validation.name_max" })
      .refine((val) => !val || !/[<>{}]/g.test(val), {
        message: "validation.name_invalid_chars",
      })
      .optional(),

    position: z
      .string()
      .trim()
      .max(100, { message: "validation.position_max" })
      .optional(),

    company: z
      .string()
      .trim()
      .max(100, { message: "validation.company_max" })
      .optional(),

    whatsapp: z.string().trim().optional(),

    desiredTopic: z.string().trim().max(150).optional().or(z.literal("")),

    peopleCount: z.coerce.number().int().min(1).max(500).optional().default(1),

    fullName: z
      .string()
      .trim()
      .max(100, { message: "validation.name_max" })
      .refine((val) => !val || !/[<>{}]/g.test(val), {
        message: "validation.name_invalid_chars",
      })
      .optional(),

    phone: z.string().trim().optional(),

    email: z
      .string()
      .trim()
      .max(120, { message: "validation.email_max" })
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => {
          if (!val || val === "") return true;
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        },
        { message: "validation.email_invalid" }
      ),

    consent: z.literal(true, {
      errorMap: () => ({ message: "validation.consent_required" }),
    }),

    locale: z.enum(["en", "ar"]).default("en"),

    // Honeypot field for bot protection. Must be empty.
    botField: z
      .string()
      .max(0, { message: "validation.bot_detected" })
      .optional()
      .or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    // 1. Name validation
    if (!data.fullName && (!data.firstName || !data.lastName)) {
      if (!data.firstName || data.firstName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["firstName"],
          message: "validation.name_min",
        });
      }
      if (!data.lastName || data.lastName.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["lastName"],
          message: "validation.name_min",
        });
      }
    } else if (data.fullName && data.fullName.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fullName"],
        message: "validation.name_min",
      });
    }

    // 2. Phone / WhatsApp validation
    const rawPhone = data.whatsapp !== undefined && data.whatsapp !== "" ? data.whatsapp : data.phone;
    const phoneField = data.whatsapp !== undefined ? "whatsapp" : "phone";

    if (!rawPhone || rawPhone.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: [phoneField],
        message: "validation.phone_required",
      });
    } else {
      const result = normalizeAlgerianPhone(rawPhone);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [phoneField],
          message: "validation.phone_invalid_algerian",
        });
      }
    }

    // 3. Visitor Required Fields: Position & Company if visitor format is used
    if (data.firstName || data.lastName || data.whatsapp) {
      if (!data.position || data.position.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["position"],
          message: "validation.position_min",
        });
      }
      if (!data.company || data.company.trim().length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["company"],
          message: "validation.company_min",
        });
      }
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

/**
 * Vote submission validation schema
 */
export const voteSchema = z.object({
  topicId: z.string().uuid({ message: "validation.invalid_topic_id" }),
});

export type VoteInput = z.infer<typeof voteSchema>;

/**
 * Admin raffle draw validation schema
 */
export const raffleDrawSchema = z
  .object({
    winnerCount: z.coerce
      .number()
      .int({ message: "validation.winner_count_int" })
      .min(1, { message: "validation.winner_count_min" })
      .max(50, { message: "validation.winner_count_max" })
      .optional(),
    count: z.coerce
      .number()
      .int({ message: "validation.winner_count_int" })
      .min(1, { message: "validation.winner_count_min" })
      .max(50, { message: "validation.winner_count_max" })
      .optional(),
  })
  .transform((data) => ({
    winnerCount: data.winnerCount ?? data.count ?? 1,
  }));

export type RaffleDrawInput = z.infer<typeof raffleDrawSchema>;

/**
 * Admin login validation schema
 */
export const adminLoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "validation.email_invalid" }),
  password: z
    .string()
    .min(6, { message: "validation.password_min" }),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
