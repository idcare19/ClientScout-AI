import { CLIENTSCOUT_LABEL } from "./constants";

describe("appwrite label constants", () => {
  it("uses the alphanumeric label name required by Appwrite", () => {
    expect(CLIENTSCOUT_LABEL).toBe("clientscoutaccess");
    expect(CLIENTSCOUT_LABEL).toMatch(/^[a-z0-9]+$/);
  });
});
