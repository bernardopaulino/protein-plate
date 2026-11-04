import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  OPS_METRICS,
  authStatusMetric,
  once,
  opsDay,
  recipeOutcomeMetric,
  type OpsMetric,
} from "./ops-metrics";
import { RECIPE_ERROR_CODES } from "./recipe-options";

describe("OPS_METRICS (contrato com o backoffice)", () => {
  it("são os nomes combinados, sem repetidos", () => {
    expect(new Set(OPS_METRICS).size).toBe(OPS_METRICS.length);
    expect(OPS_METRICS).toEqual([
      "recipes.ok.new",
      "recipes.ok.cached",
      "recipes.error.invalid_request",
      "recipes.error.unknown_food",
      "recipes.error.restricted_food",
      "recipes.error.unauthorized",
      "recipes.error.onboarding_required",
      "recipes.error.rate_limited",
      "recipes.error.quota_exceeded",
      "recipes.error.generation_failed",
      "recipes.error.service_unavailable",
      "recipes.retry",
      "recipes.retry_skipped",
      "recipes.slow",
      "recipes.5xx",
      "auth.400",
      "auth.401",
      "auth.403",
      "auth.404",
      "auth.413",
      "auth.429",
      "auth.5xx",
      "actions.error",
      "actions.rejected",
    ]);
  });

  it("só têm letras minúsculas, algarismos, _ e pontos (nada de uma pessoa ou de um pedido)", () => {
    for (const metric of OPS_METRICS) expect(metric).toMatch(/^[a-z0-9_]+(\.[a-z0-9_]+)+$/);
  });
});

describe("recipeOutcomeMetric", () => {
  it("receita nova, da cache e um nome por código de erro", () => {
    expect(recipeOutcomeMetric({ ok: true, cached: false })).toBe("recipes.ok.new");
    expect(recipeOutcomeMetric({ ok: true, cached: true })).toBe("recipes.ok.cached");
    for (const code of RECIPE_ERROR_CODES) {
      const metric = recipeOutcomeMetric({ ok: false, code });
      expect(metric).toBe(`recipes.error.${code}`);
      expect(OPS_METRICS).toContain(metric);
    }
  });
});

describe("authStatusMetric", () => {
  it("conta as recusas e os limites pelo estado", () => {
    for (const status of [400, 401, 403, 404, 413, 429]) {
      expect(authStatusMetric(status)).toBe(`auth.${status}`);
    }
  });

  it("junta os 5xx e ignora os sucessos e os redirects", () => {
    fc.assert(
      fc.property(fc.integer({ min: 500, max: 599 }), (status) => {
        expect(authStatusMetric(status)).toBe("auth.5xx");
      }),
    );
    for (const status of [200, 204, 302, 307, 405, 422]) {
      expect(authStatusMetric(status)).toBeNull();
    }
  });
});

describe("opsDay e once", () => {
  it("o dia é o de UTC", () => {
    expect(opsDay(Date.UTC(2026, 10, 4, 23, 59, 59))).toBe("2026-11-04");
    expect(opsDay(Date.UTC(2026, 10, 5, 0, 0, 0))).toBe("2026-11-05");
  });

  it("once dá um contador a 1", () => {
    const metric: OpsMetric = "recipes.retry";
    expect(once(metric)).toEqual({ "recipes.retry": 1 });
  });
});
