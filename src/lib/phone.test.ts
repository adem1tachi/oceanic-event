import { describe, it, expect } from "vitest";
import {
  normalizeAlgerianPhone,
  isValidAlgerianPhone,
  formatAlgerianPhoneDisplay,
} from "./phone";

describe("Algerian Phone Normalization & Validation", () => {
  describe("Valid local format", () => {
    it("normalizes standard 05 (Ooredoo) numbers", () => {
      const res = normalizeAlgerianPhone("0550123456");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("+213550123456");
    });

    it("normalizes standard 06 (Mobilis) numbers", () => {
      const res = normalizeAlgerianPhone("0661987654");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("+213661987654");
    });

    it("normalizes standard 07 (Djezzy) numbers", () => {
      const res = normalizeAlgerianPhone("0770554433");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("+213770554433");
    });
  });

  describe("Valid international formats", () => {
    it("handles +213 prefix", () => {
      const res = normalizeAlgerianPhone("+213550123456");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("+213550123456");
    });

    it("handles 00213 prefix", () => {
      const res = normalizeAlgerianPhone("00213661987654");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("+213661987654");
    });

    it("handles 213 prefix without plus or double-zero", () => {
      const res = normalizeAlgerianPhone("213770554433");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("+213770554433");
    });

    it("handles French-style +213 (0) 5... format", () => {
      const res = normalizeAlgerianPhone("+213 (0) 550 12 34 56");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("+213550123456");
    });
  });

  describe("Formatting variations", () => {
    it("strips whitespace cleanly", () => {
      const res = normalizeAlgerianPhone("  05 50 12 34 56  ");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("+213550123456");
    });

    it("strips hyphens and periods", () => {
      const res = normalizeAlgerianPhone("06-61-98-76-54");
      expect(res.isValid).toBe(true);
      expect(res.normalized).toBe("+213661987654");

      const res2 = normalizeAlgerianPhone("07.70.55.44.33");
      expect(res2.isValid).toBe(true);
      expect(res2.normalized).toBe("+213770554433");
    });
  });

  describe("Invalid cases", () => {
    it("rejects non-mobile Algerian landline numbers (e.g. 021, 023, 031)", () => {
      expect(normalizeAlgerianPhone("021123456").isValid).toBe(false);
      expect(normalizeAlgerianPhone("023456789").isValid).toBe(false);
      expect(normalizeAlgerianPhone("+21321123456").isValid).toBe(false);
    });

    it("rejects invalid prefixes (e.g. 01, 04, 08, 09)", () => {
      expect(normalizeAlgerianPhone("041234567").isValid).toBe(false);
      expect(normalizeAlgerianPhone("081234567").isValid).toBe(false);
      expect(normalizeAlgerianPhone("091234567").isValid).toBe(false);
    });

    it("rejects short numbers", () => {
      expect(normalizeAlgerianPhone("05501234").isValid).toBe(false);
      expect(normalizeAlgerianPhone("0550").isValid).toBe(false);
    });

    it("rejects excessively long numbers", () => {
      expect(normalizeAlgerianPhone("055012345678").isValid).toBe(false);
      expect(normalizeAlgerianPhone("+213550123456789").isValid).toBe(false);
    });

    it("rejects letters and special characters", () => {
      expect(normalizeAlgerianPhone("0550abc456").isValid).toBe(false);
      expect(normalizeAlgerianPhone("phone-number").isValid).toBe(false);
    });

    it("rejects empty or whitespace-only strings", () => {
      expect(normalizeAlgerianPhone("").isValid).toBe(false);
      expect(normalizeAlgerianPhone("   ").isValid).toBe(false);
    });
  });

  describe("isValidAlgerianPhone boolean helper", () => {
    it("returns true for valid and false for invalid", () => {
      expect(isValidAlgerianPhone("0550123456")).toBe(true);
      expect(isValidAlgerianPhone("0123456789")).toBe(false);
    });
  });

  describe("formatAlgerianPhoneDisplay helper", () => {
    it("formats E.164 phone into readable national format", () => {
      expect(formatAlgerianPhoneDisplay("+213550123456")).toBe("0550 12 34 56");
      expect(formatAlgerianPhoneDisplay("0661987654")).toBe("0661 98 76 54");
    });
  });
});
