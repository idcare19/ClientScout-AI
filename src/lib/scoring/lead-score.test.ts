import { calculateLeadScore, getLeadPriority, getLeadScoreBreakdown } from "./lead-score";

describe("lead scoring", () => {
  it("calculates deterministic scores", () => {
    const score = calculateLeadScore({
      websiteStatus: "not_found",
      whatsapp: "+1 555 0101",
      email: "hello@example.com",
      sourceUrl: "https://example.com/contact",
      contactVerification: "verified",
      verificationConfidence: 90,
      mainOpportunity: "Redesign needed",
      recommendedService: "Website redesign",
      status: "new",
    });

    expect(score).toBeGreaterThan(0);
    expect(getLeadPriority(score)).toBe("hot");
    expect(getLeadScoreBreakdown({ websiteStatus: "not_found" }).some((item) => item.label === "Website not found")).toBe(true);
  });

  it("forces rejected leads to zero", () => {
    expect(calculateLeadScore({ status: "rejected" })).toBe(0);
  });
});
