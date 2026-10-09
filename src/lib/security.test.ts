import { describe, it, expect } from "vitest";
import { checkRateLimit, getClientIp } from "./rate-limit";

describe("Security Rate Limiter", () => {
  it("allows requests under the limit and blocks exceeding requests", () => {
    const key = `test-ip-${Date.now()}`;
    const limit = 3;
    const windowMs = 5000;

    const res1 = checkRateLimit(key, limit, windowMs);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(key, limit, windowMs);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(key, limit, windowMs);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    const res4 = checkRateLimit(key, limit, windowMs);
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
  });

  it("extracts client IP safely from proxy headers", () => {
    const headers = new Headers();
    headers.set("x-forwarded-for", "198.51.100.42, 10.0.0.1");
    expect(getClientIp(headers)).toBe("198.51.100.42");

    const directHeaders = new Headers();
    directHeaders.set("x-real-ip", "203.0.113.19");
    expect(getClientIp(directHeaders)).toBe("203.0.113.19");

    const emptyHeaders = new Headers();
    expect(getClientIp(emptyHeaders)).toBe("127.0.0.1");
  });
});

describe("CSV Formula Injection Neutralization", () => {
  const escapeCsv = (val: string | number | boolean | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    let str = String(val).replace(/"/g, '""');
    if (/^[=+@\-\t\r]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str}"`;
  };

  it("escapes formula injection triggers starting with =, +, -, @, tab, or CR", () => {
    expect(escapeCsv("=SUM(1,2)")).toBe(`"'=SUM(1,2)"`);
    expect(escapeCsv("+cmd|' /C calc'!A0")).toBe(`"'+cmd|' /C calc'!A0"`);
    expect(escapeCsv("-10")).toBe(`"'-10"`);
    expect(escapeCsv("@leak")).toBe(`"'@leak"`);
    expect(escapeCsv("\tTabbed")).toBe(`"'\tTabbed"`);
  });

  it("preserves standard safe text strings", () => {
    expect(escapeCsv("Adem Tachi")).toBe(`"Adem Tachi"`);
    expect(escapeCsv("Formatech 2026")).toBe(`"Formatech 2026"`);
    expect(escapeCsv(null)).toBe(`""`);
  });
});
