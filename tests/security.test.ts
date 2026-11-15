import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/safe-next";

const O = "http://localhost:3000";

describe("post-login redirect guard", () => {
  it("keeps same-origin paths", () => {
    expect(safeNextPath("/vault?x=1#a", O)).toBe("/vault?x=1#a");
    expect(safeNextPath(null, O)).toBe("/");
  });
  it("rejects open-redirect tricks", () => {
    for (const evil of ["//evil.com", "/\\evil.com", "/\t/evil.com", decodeURIComponent("/%09/evil.com"), "https://evil.com/x", "javascript:alert(1)", "/%5Cevil.com".replace("%5C", "\\")]) {
      expect(safeNextPath(evil, O)).toBe("/");
    }
  });
});
