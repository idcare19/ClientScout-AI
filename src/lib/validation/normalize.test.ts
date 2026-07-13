import { isLikelyDuplicate } from "@/lib/csv/leads";
import { normalizeEmail, normalizePhone, normalizeUrl, normalizeWhitespace } from "./normalize";

describe("normalization", () => {
  it("normalizes whitespace and contact values", () => {
    expect(normalizeWhitespace("  hello   world  ")).toBe("hello world");
    expect(normalizeEmail("TEST@Example.com")).toBe("test@example.com");
    expect(normalizePhone("(555) 123-4567")).toBe("5551234567");
    expect(normalizeUrl("example.com/")).toBe("https://example.com");
  });

  it("detects likely duplicates", () => {
    expect(
      isLikelyDuplicate(
        { email: "hello@example.com", businessName: "Alpha", city: "Mumbai", website: "https://alpha.com" },
        { email: "hello@example.com", businessName: "Beta", city: "Delhi", website: "https://beta.com" },
      ),
    ).toBe(true);
  });
});
