import { runWebsiteAudit } from "./website-checker";

describe("website checker safety", () => {
  it("blocks unsafe urls without fetching", async () => {
    const result = await runWebsiteAudit({ requestedUrl: "javascript:alert(1)", businessName: "Test" });
    expect(result.auditStatus).toBe("unsafe_url");
    expect(result.errorCode).toBe("unsafe_url");
  });

  it("blocks localhost urls", async () => {
    const result = await runWebsiteAudit({ requestedUrl: "http://localhost:3000", businessName: "Test" });
    expect(result.auditStatus).toBe("unsafe_url");
  });
});
