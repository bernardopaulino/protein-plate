import { describe, expect, it } from "vitest";
import { isCrossOrigin } from "@/server/origin";

const APP = "https://protein-plate.app";
const req = (origin?: string) =>
  new Request(`${APP}/api/recipes`, {
    method: "POST",
    headers: origin ? { origin } : {},
  });

describe("pedidos de outro site", () => {
  it("o mesmo site e pedidos sem Origin passam", () => {
    expect(isCrossOrigin(req(APP))).toBe(false);
    expect(isCrossOrigin(req())).toBe(false);
  });

  it("outro site, subdomínio ou esquema são recusados", () => {
    expect(isCrossOrigin(req("https://evil.example"))).toBe(true);
    expect(isCrossOrigin(req("https://staging.protein-plate.app"))).toBe(true);
    expect(isCrossOrigin(req("http://protein-plate.app"))).toBe(true);
    expect(isCrossOrigin(req("null"))).toBe(true);
  });
});
