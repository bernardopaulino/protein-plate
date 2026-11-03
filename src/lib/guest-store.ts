import {
  GUEST_STATE_VERSION,
  guestStateSchema,
  type GuestState,
} from "@/domain/contracts/guest-state";
import { INTENSITIES, type Intensity } from "@/domain/goal";

/** Chave do estado de convidado no localStorage (a versão vai dentro do valor). */
export const GUEST_STORAGE_KEY = "protein-plate:guest";

type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Intensidade guardada como fator (ex.: 2.0, do protótipo) → chave ("alta"). */
function intensityFromFactor(value: unknown): Intensity | unknown {
  if (typeof value !== "number") return value;
  const match = (Object.entries(INTENSITIES) as [Intensity, number][]).find(
    ([, factor]) => Math.abs(factor - value) < 1e-9,
  );
  return match ? match[0] : value;
}

/**
 * Migra versões antigas para a atual. Versão 0 (sem `version` ou intensidade numérica): converte a
 * intensidade e acrescenta os campos novos. Devolve o objeto tal como está se já for atual.
 */
export function migrateGuestState(raw: unknown): unknown {
  if (!isRecord(raw)) return raw;
  const version = raw.version ?? 0;
  if (version === GUEST_STATE_VERSION) return raw;
  if (version === 1) {
    const target = isRecord(raw.target) ? raw.target : {};
    // O exemplo da especificação usa a intensidade numérica dentro da versão 1; a 2 traz o pré-treino
    return {
      ...raw,
      version: GUEST_STATE_VERSION,
      target: { ...target, intensity: intensityFromFactor(target.intensity) },
      preWorkoutMeal: null,
    };
  }
  if (version === 0) {
    const target = isRecord(raw.target) ? raw.target : {};
    return {
      ...raw,
      version: GUEST_STATE_VERSION,
      target: {
        manual: false,
        weightKg: null,
        ...target,
        intensity: intensityFromFactor(target.intensity),
      },
      postWorkoutMeal: raw.postWorkoutMeal ?? null,
      preWorkoutMeal: null,
      updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : 0,
    };
  }
  return raw;
}

/** Lê e valida; versão antiga → migra; inválido → apaga e recomeça (sem rebentar). */
export function readGuestState(storage: Storage): GuestState | null {
  let text: string | null;
  try {
    text = storage.getItem(GUEST_STORAGE_KEY);
  } catch {
    return null; // modo privado / armazenamento bloqueado
  }
  if (!text) return null;
  try {
    const parsed = guestStateSchema.safeParse(migrateGuestState(JSON.parse(text)));
    if (parsed.success) return parsed.data;
  } catch {
    // JSON inválido: recomeça
  }
  try {
    storage.removeItem(GUEST_STORAGE_KEY);
  } catch {
    // ignorar
  }
  return null;
}

export function writeGuestState(storage: Storage, state: GuestState): boolean {
  const parsed = guestStateSchema.safeParse(state);
  if (!parsed.success) return false;
  try {
    storage.setItem(GUEST_STORAGE_KEY, JSON.stringify(parsed.data));
    return true;
  } catch {
    return false;
  }
}

export function clearGuestState(storage: Storage): void {
  try {
    storage.removeItem(GUEST_STORAGE_KEY);
  } catch {
    // ignorar
  }
}

/* ------------------------------------------------------------ Subscrição (useSyncExternalStore) */

const listeners = new Set<() => void>();
let cache: { text: string | null; state: GuestState | null } = { text: null, state: null };

function browserStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function notify() {
  for (const listener of listeners) listener();
}

export function subscribeGuestState(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === GUEST_STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** Snapshot estável (o mesmo objeto enquanto o texto guardado não muda). */
export function getGuestSnapshot(): GuestState | null {
  const storage = browserStorage();
  if (!storage) return null;
  let text: string | null = null;
  try {
    text = storage.getItem(GUEST_STORAGE_KEY);
  } catch {
    return null;
  }
  if (text !== cache.text) cache = { text, state: readGuestState(storage) };
  return cache.state;
}

export function getGuestServerSnapshot(): GuestState | null {
  return null;
}

/** Guarda e avisa os componentes subscritos. */
export function saveGuestState(state: GuestState): boolean {
  const storage = browserStorage();
  if (!storage) return false;
  const ok = writeGuestState(storage, { ...state, updatedAt: Date.now() });
  notify();
  return ok;
}

export function removeGuestState(): void {
  const storage = browserStorage();
  if (storage) clearGuestState(storage);
  notify();
}
