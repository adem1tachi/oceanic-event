import { describe, it, expect } from "vitest";
import {
  registrationSchema,
  raffleDrawSchema,
  adminLoginSchema,
} from "./validators";

describe("Registration Schema Validation", () => {
  it("passes with valid participant details and local phone", () => {
    const input = {
      fullName: "Karim Belkacem",
      phone: "0550123456",
      email: "karim@example.com",
      consent: true,
      locale: "en",
      botField: "",
    };

    const res = registrationSchema.safeParse(input);
    expect(res.success).toBe(true);
  });

  it("passes with international phone format and empty email", () => {
    const input = {
      fullName: "Amina Hadj",
      phone: "+213 770 11 22 33",
      email: "",
      consent: true,
      locale: "ar",
    };

    const res = registrationSchema.safeParse(input);
    expect(res.success).toBe(true);
  });

  it("fails if full name is too short", () => {
    const input = {
      fullName: "K",
      phone: "0550123456",
      consent: true,
    };

    const res = registrationSchema.safeParse(input);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("validation.name_min");
    }
  });

  it("fails if full name contains disallowed script tags/brackets", () => {
    const input = {
      fullName: "<script>alert(1)</script>",
      phone: "0550123456",
      consent: true,
    };

    const res = registrationSchema.safeParse(input);
    expect(res.success).toBe(false);
  });

  it("fails if phone is invalid Algerian number", () => {
    const input = {
      fullName: "Yacine Brahimi",
      phone: "021998877", // Landline
      consent: true,
    };

    const res = registrationSchema.safeParse(input);
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.issues[0].message).toBe("validation.phone_invalid_algerian");
    }
  });

  it("fails if consent is false or unchecked", () => {
    const input = {
      fullName: "Sofiane Feghouli",
      phone: "0661223344",
      consent: false,
    };

    const res = registrationSchema.safeParse(input);
    expect(res.success).toBe(false);
  });

  it("fails if honeypot botField is populated", () => {
    const input = {
      fullName: "Automated Spammer",
      phone: "0550123456",
      consent: true,
      botField: "http://spam-link.ru",
    };

    const res = registrationSchema.safeParse(input);
    expect(res.success).toBe(false);
  });

  it("fails if email is provided but invalid", () => {
    const input = {
      fullName: "Riyad Mahrez",
      phone: "0550123456",
      email: "not-an-email",
      consent: true,
    };

    const res = registrationSchema.safeParse(input);
    expect(res.success).toBe(false);
  });
});

describe("Raffle Draw Schema Validation", () => {
  it("passes with valid count", () => {
    expect(raffleDrawSchema.safeParse({ winnerCount: 3 }).success).toBe(true);
    expect(raffleDrawSchema.safeParse({ winnerCount: "5" }).success).toBe(true);
  });

  it("fails with zero or negative number", () => {
    expect(raffleDrawSchema.safeParse({ winnerCount: 0 }).success).toBe(false);
    expect(raffleDrawSchema.safeParse({ winnerCount: -1 }).success).toBe(false);
  });

  it("fails with count exceeding maximum limit", () => {
    expect(raffleDrawSchema.safeParse({ winnerCount: 100 }).success).toBe(false);
  });
});

describe("Admin Login Schema Validation", () => {
  it("validates proper email and password", () => {
    const res = adminLoginSchema.safeParse({
      email: "admin@formatech.dz",
      password: "SuperSecretPassword123!",
    });
    expect(res.success).toBe(true);
  });

  it("fails with malformed email", () => {
    const res = adminLoginSchema.safeParse({
      email: "admin",
      password: "SuperSecretPassword123!",
    });
    expect(res.success).toBe(false);
  });
});

describe("Visitor Specific Registration Fields", () => {
  it("passes with valid visitor fields", () => {
    const res = registrationSchema.safeParse({
      firstName: "Adem",
      lastName: "Tachi",
      position: "IT Manager",
      company: "Sonatrach",
      whatsapp: "0550123456",
      desiredTopic: "Applied AI",
      peopleCount: 3,
      consent: true,
      locale: "ar",
    });
    expect(res.success).toBe(true);
  });

  it("fails if position or company is missing for visitor registration", () => {
    const res = registrationSchema.safeParse({
      firstName: "Adem",
      lastName: "Tachi",
      position: "",
      company: "Sonatrach",
      whatsapp: "0550123456",
      consent: true,
    });
    expect(res.success).toBe(false);
  });
});

