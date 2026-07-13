import type { Lead } from "@/types/lead";
import { calculateDuplicateConfidence, findDuplicateCandidates, getDuplicateStrength, getDuplicateReasons } from "./index";

const baseLead = {
  $id: "lead_1",
  businessName: "Northwind Studio",
  contactPerson: null,
  industry: "Web Design",
  businessType: "agency",
  country: "India",
  city: "Bengaluru",
  timezone: null,
  phone: "+91 98765 43210",
  whatsapp: null,
  email: "hello@northwindstudio.com",
  website: "https://northwindstudio.com",
  instagram: null,
  linkedin: null,
  facebook: null,
  otherSocialUrl: null,
  sourceName: "Manual research",
  sourceUrl: "https://northwindstudio.com/contact",
  sourceNotes: null,
  websiteStatus: "not_checked",
  contactVerification: "unverified",
  verificationConfidence: null,
  verificationNotes: null,
  mainOpportunity: null,
  recommendedService: null,
  status: "new",
  priority: "review",
  leadScore: 0,
  notes: null,
  lastContactedAt: null,
  nextFollowUpAt: null,
  demoUrl: null,
  ownerId: "user_1",
  createdAt: "2026-07-13T00:00:00.000Z",
  updatedAt: "2026-07-13T00:00:00.000Z",
} satisfies Lead;

describe("duplicate detection", () => {
  it("detects exact matches by email", () => {
    const candidate = { ...baseLead, $id: "lead_2" };
    expect(calculateDuplicateConfidence(candidate, { ...baseLead, email: "hello@example.com" })).toBe(100);
    expect(getDuplicateStrength(100)).toBe("exact duplicate");
    expect(getDuplicateReasons(candidate, candidate)).toContain("same normalized email");
  });

  it("finds likely duplicates by name and city", () => {
    const candidate = {
      ...baseLead,
      $id: "lead_3",
      email: null,
      phone: null,
      whatsapp: null,
      website: null,
    };
    const duplicates = findDuplicateCandidates(candidate, [
      baseLead,
      { ...baseLead, $id: "lead_4", businessName: "Northwind Studio", city: "Bengaluru", email: null, phone: null },
    ]);
    expect(duplicates[0]?.strength).toBe("likely duplicate");
  });
});
