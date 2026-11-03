import { isId, jsonStrings, type AdminDb, type SqlValue } from "./db";

/**
 * As contas, uma a uma: a lista com pesquisa e a ficha de cada pessoa. As consultas daqui nunca
 * pedem as colunas `weight_kg` nem `allergies` dos perfis (dados de saúde), nem a `intensity`
 * (com a meta, dava o peso), nem o IP ou o user agent das sessões: o que não se lê não aparece
 * (privacy.ts; os testes confirmam-no no HTML).
 */

export const USERS_PAGE_SIZE = 25;
/** A ficha mostra no máximo estas receitas guardadas (as mais recentes). */
export const SAVED_LIMIT = 50;

export const USER_SORTS = ["recentes", "antigas"] as const;
export type UserSort = (typeof USER_SORTS)[number];

/** O texto da pesquisa, limpo e curto; vazio: sem filtro. */
export function cleanQuery(value: string | undefined): string {
  const text = (value ?? "").trim().replace(/\s+/g, " ");
  const encoder = new TextEncoder();
  let out = "";
  let bytes = 2; // os dois % à volta
  for (const char of text) {
    const size = encoder.encode(escapeLike(char)).length;
    if (bytes + size > LIKE_MAX_BYTES) break;
    out += char;
    bytes += size;
  }
  return out.trimEnd();
}

/**
 * A D1 recusa um padrão LIKE com mais de 50 bytes ("LIKE or GLOB pattern too complex"), e
 * cada linha da pesquisa usa um: o texto procurado fica por aí (48 letras sem acentos).
 */
export const LIKE_MAX_BYTES = 50;
export const QUERY_MAX_CHARS = LIKE_MAX_BYTES - 2;

const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => `\\${c}`);

/** Um padrão LIKE que procura o texto tal como está (o %, o _ e o \ deixam de ser especiais). */
export function likePattern(text: string): string {
  return `%${escapeLike(text)}%`;
}

/** Um número de página válido (outro texto fica na primeira). */
export function parsePage(value: string | undefined): number {
  if (!value || !/^\d{1,6}$/.test(value)) return 1;
  return Math.max(1, Number(value));
}

export interface UserListParams {
  q: string;
  sort: UserSort;
  page: number;
}

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  providers: string[];
  onboardedAt: number | null;
  savedRecipes: number;
  lastSessionAt: number | null;
}

export interface UserList {
  total: number;
  page: number;
  pages: number;
  items: UserListItem[];
}

/** A pesquisa: parte do nome ou do email, ou o ID exato. */
function searchFilter(q: string): { where: string; params: SqlValue[] } {
  if (q === "") return { where: "1 = 1", params: [] };
  const pattern = likePattern(q);
  return {
    where: `(u.email like ? escape '\\' or u.name like ? escape '\\' or u.id = ?)`,
    params: [pattern, pattern, q],
  };
}

const ORDER: Record<UserSort, string> = {
  recentes: "u.created_at desc, u.id",
  antigas: "u.created_at asc, u.id",
};

export async function listUsers(db: AdminDb, { q, sort, page }: UserListParams): Promise<UserList> {
  const { where, params } = searchFilter(q);
  const counted = await db.first<{ n: number }>(
    `select count(*) as n from "user" u where ${where}`,
    ...params,
  );
  const total = Number(counted?.n ?? 0);
  const pages = Math.max(1, Math.ceil(total / USERS_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  const rows = await db.all<{
    id: string;
    name: string;
    email: string;
    created_at: number;
    providers: string | null;
    onboarded_at: number | null;
    saved: number;
    last_session: number | null;
  }>(
    `select u.id as id, u.name as name, u.email as email, u.created_at as created_at,
      (select group_concat(a.provider_id) from account a where a.user_id = u.id) as providers,
      p.onboarded_at as onboarded_at,
      (select count(*) from saved_recipes s where s.user_id = u.id) as saved,
      (select max(s.created_at) from session s where s.user_id = u.id) as last_session
    from "user" u
    left join profiles p on p.user_id = u.id
    where ${where}
    order by ${ORDER[sort]}
    limit ? offset ?`,
    ...params,
    USERS_PAGE_SIZE,
    (current - 1) * USERS_PAGE_SIZE,
  );
  return {
    total,
    page: current,
    pages,
    items: rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      createdAt: Number(r.created_at),
      providers: r.providers ? [...new Set(r.providers.split(","))].sort() : [],
      onboardedAt: r.onboarded_at === null ? null : Number(r.onboarded_at),
      savedRecipes: Number(r.saved ?? 0),
      lastSessionAt: r.last_session === null ? null : Number(r.last_session),
    })),
  };
}

/** As preferências da ficha: sem o peso, as alergias nem a intensidade (ver o topo). */
export interface UserProfile {
  dailyTargetG: number;
  meals: string[];
  preWorkoutMeal: string | null;
  postWorkoutMeal: string | null;
  diet: string;
  equipment: string[];
  cookMinutes: number;
  likedFoods: string[];
  locale: string;
  consentVersion: number | null;
  consentedAt: number | null;
  /** Só a data do consentimento de dados de saúde: nunca os dados. */
  healthConsentAt: number | null;
  onboardedAt: number | null;
  updatedAt: number;
}

export interface SavedRecipe {
  id: string;
  title: string;
  meal: string;
  proteinPerServingG: number;
  savedAt: number;
}

export interface UserDetail {
  id: string;
  name: string;
  email: string;
  createdAt: number;
  providers: { id: string; createdAt: number }[];
  /** Sessões ainda válidas e a mais recente (a data de entrada; as sessões não guardam IP). */
  sessions: { active: number; lastCreatedAt: number | null; lastSeenAt: number | null };
  /** null: a conta ainda não tem perfil (não chegou a guardar nada). */
  profile: UserProfile | null;
  saved: SavedRecipe[];
  savedTotal: number;
  /** Os alimentos do dia guardado (o que o apagar leva). */
  planItems: number;
}

export async function userDetail(db: AdminDb, id: string, now: number): Promise<UserDetail | null> {
  if (!isId(id)) return null;
  const account = await db.first<{ id: string; name: string; email: string; created_at: number }>(
    `select id, name, email, created_at from "user" where id = ?`,
    id,
  );
  if (!account) return null;
  const [providers, sessions, profile, saved, counts] = await Promise.all([
    db.all<{ provider_id: string; created_at: number }>(
      "select provider_id, created_at from account where user_id = ? order by created_at",
      id,
    ),
    db.first<{ n: number; last_created: number | null; last_seen: number | null }>(
      `select count(*) as n, max(created_at) as last_created, max(updated_at) as last_seen
      from session where user_id = ? and expires_at > ?`,
      id,
      now,
    ),
    // As colunas uma a uma: nunca weight_kg, allergies nem intensity
    db.first<{
      daily_target_g: number;
      meals: string;
      pre_workout_meal: string | null;
      post_workout_meal: string | null;
      diet: string;
      equipment: string;
      cook_minutes: number;
      liked_foods: string;
      locale: string;
      consent_version: number | null;
      consented_at: number | null;
      health_consent_at: number | null;
      onboarded_at: number | null;
      updated_at: number;
    }>(
      `select daily_target_g, meals, pre_workout_meal, post_workout_meal, diet, equipment,
        cook_minutes, liked_foods, locale, consent_version, consented_at, health_consent_at,
        onboarded_at, updated_at
      from profiles where user_id = ?`,
      id,
    ),
    db.all<{
      id: string;
      title: string;
      meal: string;
      protein_per_serving_g: number;
      saved_at: number;
    }>(
      `select r.id as id, r.title as title, r.meal as meal,
        r.protein_per_serving_g as protein_per_serving_g, s.saved_at as saved_at
      from saved_recipes s join recipes r on r.id = s.recipe_id
      where s.user_id = ?
      order by s.saved_at desc
      limit ?`,
      id,
      SAVED_LIMIT,
    ),
    db.first<{ saved: number; items: number }>(
      `select (select count(*) from saved_recipes where user_id = ?) as saved,
        (select count(*) from plan_items i join day_plans d on d.id = i.plan_id
          where d.user_id = ?) as items`,
      id,
      id,
    ),
  ]);
  return {
    id: account.id,
    name: account.name,
    email: account.email,
    createdAt: Number(account.created_at),
    providers: providers.map((p) => ({ id: p.provider_id, createdAt: Number(p.created_at) })),
    sessions: {
      active: Number(sessions?.n ?? 0),
      lastCreatedAt: sessions?.last_created == null ? null : Number(sessions.last_created),
      lastSeenAt: sessions?.last_seen == null ? null : Number(sessions.last_seen),
    },
    profile: profile
      ? {
          dailyTargetG: Number(profile.daily_target_g),
          meals: jsonStrings(profile.meals),
          preWorkoutMeal: profile.pre_workout_meal,
          postWorkoutMeal: profile.post_workout_meal,
          diet: profile.diet,
          equipment: jsonStrings(profile.equipment),
          cookMinutes: Number(profile.cook_minutes),
          likedFoods: jsonStrings(profile.liked_foods),
          locale: profile.locale,
          consentVersion: profile.consent_version,
          consentedAt: profile.consented_at,
          healthConsentAt: profile.health_consent_at,
          onboardedAt: profile.onboarded_at,
          updatedAt: Number(profile.updated_at),
        }
      : null,
    saved: saved.map((s) => ({
      id: s.id,
      title: s.title,
      meal: s.meal,
      proteinPerServingG: Number(s.protein_per_serving_g),
      savedAt: Number(s.saved_at),
    })),
    savedTotal: Number(counts?.saved ?? 0),
    planItems: Number(counts?.items ?? 0),
  };
}

/** Para as ações: o email de uma conta (para confirmar o apagar), ou null se não existe. */
export async function accountEmail(db: AdminDb, id: string): Promise<string | null> {
  if (!isId(id)) return null;
  const row = await db.first<{ email: string }>(`select email from "user" where id = ?`, id);
  return row?.email ?? null;
}
