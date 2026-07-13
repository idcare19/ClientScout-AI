import { leadFormSchema } from "./lead";

describe("lead schema", () => {
  it("requires source evidence", () => {
    expect(
      leadFormSchema.safeParse({
        businessName: "Alpha",
        contactPerson: null,
        industry: "Agency",
        businessType: "agency",
        country: "India",
        city: null,
        timezone: null,
        phone: null,
        whatsapp: null,
        email: null,
        website: null,
        instagram: null,
        linkedin: null,
        facebook: null,
        otherSocialUrl: null,
        sourceName: "",
        sourceUrl: null,
        sourceNotes: null,
        websiteStatus: "not_checked",
        contactVerification: "unverified",
        verificationConfidence: null,
        verificationNotes: null,
        mainOpportunity: null,
        recommendedService: null,
        status: "new",
        priority: "review",
        notes: null,
        lastContactedAt: null,
        nextFollowUpAt: null,
        demoUrl: null,
      }).success,
    ).toBe(false);
  });
});
