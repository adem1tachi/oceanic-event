import { z } from "zod";
import { normalizeAlgerianPhone } from "./phone";

/**
 * Registration form validation schema for both client-side and server-side verification.
 */
export const registrationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "validation.name_min" })
    .max(100, { message: "validation.name_max" })
    .refine((val) => !/[<>{}]/g.test(val), {
      message: "validation.name_invalid_chars",
    }),

  phone: z
    .string()
    .trim()
    .min(1, { message: "validation.phone_required" })
    .superRefine((val, ctx) => {
      const result = normalizeAlgerianPhone(val);
      if (!result.isValid) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "validation.phone_invalid_algerian",
        });
      }
    }),

  email: z
    .string()
    .trim()
    .max(120, { message: "validation.email_max" })
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => {
        if (!val || val === "") return true;
        // Standard email regex
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
export const raffleDrawSchema = z.object({
  winnerCount: z.coerce
    .number()
    .int({ message: "validation.winner_count_int" })
    .min(1, { message: "validation.winner_count_min" })
    .max(50, { message: "validation.winner_count_max" }),
});

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
