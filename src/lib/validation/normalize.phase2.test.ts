import {
  buildMailtoUrl,
  buildWhatsAppUrl,
  extractRootDomain,
  normalizeBusinessName,
  normalizeCountry,
  normalizeEmail,
  normalizePhoneDetailed,
  normalizeWebsiteUrl,
} from "./normalize";

describe("phase 2 normalization", () => {
  it("normalizes email and website data", () => {
    expect(normalizeEmail("TEST@Example.com")).toBe("test@example.com");
    expect(normalizeWebsiteUrl("Example.com/path#hash")).toBe("https://example.com/path");
    expect(extractRootDomain("https://www.example.co.uk")).toBe("example.co.uk");
    expect(normalizeBusinessName("  Northwind   Studio  ")).toBe("northwind studio");
    expect(normalizeCountry("  INDIA ")).toBe("india");
  });

  it("normalizes phone and link builders", () => {
    const phone = normalizePhoneDetailed("+1 (415) 555-0101", "US");
    expect(phone.isValid).toBe(true);
    expect(phone.e164).toBe("+14155550101");
    expect(buildWhatsAppUrl(phone.e164, "Hello there")).toBe("https://wa.me/14155550101?text=Hello%20there");
    expect(buildMailtoUrl("hello@example.com", "Subject line", "Body text")).toContain("mailto:hello@example.com");
  });
});
