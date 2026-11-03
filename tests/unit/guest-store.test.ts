import { describe, expect, it } from "vitest";
import {
  GUEST_STORAGE_KEY,
  migrateGuestState,
  readGuestState,
  writeGuestState,
} from "@/lib/guest-store";
import type { GuestState } from "@/domain/contracts/guest-state";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
  };
}

const state: GuestState = {
  version: 2,
  target: { grams: 160, intensity: "alta", weightKg: 80, manual: false },
  meals: ["pequeno-almoco", "almoco", "lanche", "jantar"],
  postWorkoutMeal: "lanche",
  preWorkoutMeal: "almoco",
  plan: { items: [], seed: 0, isExample: true },
  updatedAt: 1,
  owner: "u1",
};

describe("guest store", () => {
  it("escreve e lê o estado validado", () => {
    const storage = memoryStorage();
    expect(writeGuestState(storage, state)).toBe(true);
    expect(readGuestState(storage)).toEqual(state);
  });

  it("aceita o exemplo da especificação com a intensidade numérica (2.0 → alta)", () => {
    const storage = memoryStorage({
      [GUEST_STORAGE_KEY]: JSON.stringify({
        version: 1,
        target: { grams: 160, intensity: 2.0, weightKg: 80 },
        meals: ["pequeno-almoco", "almoco", "lanche", "jantar"],
        postWorkoutMeal: "lanche",
        plan: {
          items: [
            {
              id: "b1",
              meal: "pequeno-almoco",
              foodId: "skyr-natural",
              portionId: "skyr-natural:iogurte",
              count: 1,
            },
          ],
        },
        updatedAt: 1793577600000,
      }),
    });
    const read = readGuestState(storage);
    expect(read?.target.intensity).toBe("alta");
    expect(read?.plan.items).toHaveLength(1);
    // A versão 1 passa a 2, sem refeição pré-treino
    expect(read?.version).toBe(2);
    expect(read?.preWorkoutMeal).toBeNull();
  });

  it("migra a versão 0 (sem versão) para a atual", () => {
    const migrated = migrateGuestState({
      target: { grams: 120, intensity: 1.6 },
      meals: ["almoco", "jantar"],
      plan: { items: [] },
    }) as GuestState;
    expect(migrated.version).toBe(2);
    expect(migrated.preWorkoutMeal).toBeNull();
    expect(migrated.target).toMatchObject({ intensity: "base", manual: false, weightKg: null });
    expect(migrated.postWorkoutMeal).toBeNull();
  });

  it("estado inválido: apaga e recomeça sem rebentar", () => {
    const storage = memoryStorage({ [GUEST_STORAGE_KEY]: "{não é json" });
    expect(readGuestState(storage)).toBeNull();
    expect(storage.data.has(GUEST_STORAGE_KEY)).toBe(false);

    const wrong = memoryStorage({ [GUEST_STORAGE_KEY]: JSON.stringify({ version: 99 }) });
    expect(readGuestState(wrong)).toBeNull();
    expect(migrateGuestState("x")).toBe("x");
  });

  it("não escreve estados inválidos e sobrevive a armazenamento bloqueado", () => {
    const storage = memoryStorage();
    expect(writeGuestState(storage, { ...state, meals: ["almoco"] })).toBe(false);
    const blocked = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("QuotaExceeded");
      },
      removeItem: () => {
        throw new Error("SecurityError");
      },
    };
    expect(readGuestState(blocked)).toBeNull();
    expect(writeGuestState(blocked, state)).toBe(false);
  });
});
