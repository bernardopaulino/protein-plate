import type { AdminDb } from "./db";
import { DAY_MS, dayOf, weekStartDay } from "./format";
import { lastDays, lastWeeks } from "./metrics";

/**
 * O uso da app, a partir do que já existe na base, sem rastreio novo (como no backoffice do
 * Rejection Quest). Um "dia ativo" é um dia (UTC) em que a pessoa fez alguma coisa que fica na
 * base: entrou ou usou a app com sessão (a sessão renova-se uma vez por dia de uso), pediu ou
 * guardou uma receita, pôs uma no dia, mudou o dia ou as preferências. O dia guarda só a última
 * mudança, por isso a atividade antiga conta-se sobretudo pelas sessões e pelas receitas. Só
 * contagens: nunca uma linha de uma pessoa sai daqui.
 */

/** Quantos dias mostra a série de pessoas ativas (o de hoje incluído). */
export const ACTIVE_DAYS = 30;
/** As contas criadas nas últimas COHORT_WEEKS semanas, seguidas semana a semana. */
export const COHORT_WEEKS = 8;
/** O funil só conta contas com pelo menos 14 dias: a 2.ª semana já terminou para todas. */
export const FUNNEL_MIN_AGE_DAYS = 14;

/**
 * Cada coisa que conta como atividade: a conta e o momento (epoch ms). Um SELECT só, sem CTE (a D1
 * do backoffice só aceita SELECT, db.ts), e no máximo 5 partes no UNION (o limite da D1). As
 * sessões dão o dia de entrada (created_at) e o último dia de uso (updated_at, renovado uma vez
 * por dia); o dia muda também quando a pessoa põe uma receita no dia ou guarda as preferências.
 */
export const ACTIVITY = `(
  select user_id, created_at as at from session
  union all select user_id, updated_at from session
  union all select user_id, created_at from user_recipes
  union all select user_id, saved_at from saved_recipes
  union all select user_id, updated_at from day_plans
)`;

export interface ActiveMetrics {
  /** Os dias (desde 1/1/1970, UTC), do mais antigo para hoje. */
  days: number[];
  /** Pessoas ativas em cada dia. */
  perDay: number[];
  /** Média dos últimos 7 dias completos (sem hoje). */
  dailyAverage: number;
  /** Pessoas diferentes nos últimos 7 e 30 dias (hoje incluído). */
  weekly: number;
  monthly: number;
}

export async function activeMetrics(db: AdminDb, now: number): Promise<ActiveMetrics> {
  const days = lastDays(now, ACTIVE_DAYS);
  const since = (days[0] ?? dayOf(now)) * DAY_MS;
  const weekSince = (dayOf(now) - 6) * DAY_MS;
  const [perDayRows, windows] = await Promise.all([
    db.all<{ d: number; n: number }>(
      `select at / 86400000 as d, count(distinct user_id) as n from ${ACTIVITY}
      where at >= ? group by 1`,
      since,
    ),
    db.first<{ weekly: number; monthly: number }>(
      `select count(distinct case when at >= ? then user_id end) as weekly,
        count(distinct user_id) as monthly
      from ${ACTIVITY} where at >= ?`,
      weekSince,
      since,
    ),
  ]);
  const byDay = new Map(perDayRows.map((r) => [Number(r.d), Number(r.n)]));
  const perDay = days.map((day) => byDay.get(day) ?? 0);
  // Os 7 dias antes de hoje (hoje ainda está a decorrer)
  const complete = perDay.slice(-8, -1);
  return {
    days,
    perDay,
    dailyAverage: complete.reduce((a, b) => a + b, 0) / Math.max(complete.length, 1),
    weekly: Number(windows?.weekly ?? 0),
    monthly: Number(windows?.monthly ?? 0),
  };
}

export interface Cohort {
  /** A segunda-feira (dia desde 1970, UTC) da semana em que as contas foram criadas. */
  week: number;
  size: number;
  /**
   * Por semana desde o registo (0 = os primeiros 7 dias de cada pessoa): quantas voltaram nessa
   * semana; null enquanto a semana ainda não terminou para todas as contas da coorte.
   */
  retained: (number | null)[];
}

export async function cohortMetrics(db: AdminDb, now: number): Promise<Cohort[]> {
  const weeks = lastWeeks(now, COHORT_WEEKS);
  const firstWeek = weeks[0] ?? weekStartDay(now);
  const since = firstWeek * DAY_MS;
  const [accounts, activity] = await Promise.all([
    db.all<{ id: string; created_at: number }>(
      `select id, created_at from "user" where created_at >= ?`,
      since,
    ),
    db.all<{ user_id: string; d: number }>(
      `select a.user_id as user_id, a.at / 86400000 as d
      from ${ACTIVITY} a join "user" u on u.id = a.user_id
      where u.created_at >= ? group by 1, 2`,
      since,
    ),
  ]);
  const daysByUser = new Map<string, number[]>();
  for (const r of activity) {
    const list = daysByUser.get(r.user_id) ?? [];
    list.push(Number(r.d));
    daysByUser.set(r.user_id, list);
  }
  const today = dayOf(now);
  return weeks.map((week) => {
    const members = accounts.filter((a) => weekStartDay(Number(a.created_at)) === week);
    const retained = Array.from({ length: COHORT_WEEKS }, (_, k) => {
      // A última conta da coorte (criada ao domingo) termina a semana k no dia week + 6 + 7k + 6
      if (today < week + 7 * k + 13) return null;
      return members.filter((member) => {
        const start = dayOf(Number(member.created_at));
        return (daysByUser.get(member.id) ?? []).some((day) => Math.floor((day - start) / 7) === k);
      }).length;
    });
    return { week, size: members.length, retained };
  });
}

export interface FunnelMetrics {
  /** As contas com pelo menos FUNNEL_MIN_AGE_DAYS dias (as que entram no funil). */
  eligible: number;
  onboarded: number;
  /** Pediram pelo menos uma receita (nova ou da cache). */
  firstRecipe: number;
  /** Guardaram uma receita ou puseram uma no dia. */
  keptRecipe: number;
  /** Voltaram na 2.ª semana depois do registo (dias 7 a 13). */
  returned: number;
  /** As contas mais recentes, que ainda não entram. */
  recent: number;
}

export async function funnelMetrics(db: AdminDb, now: number): Promise<FunnelMetrics> {
  const cutoff = now - FUNNEL_MIN_AGE_DAYS * DAY_MS;
  const row = await db.first<{
    eligible: number;
    onboarded: number;
    first_recipe: number;
    kept_recipe: number;
    returned: number;
    recent: number;
  }>(
    `select
      coalesce(sum(case when u.created_at <= ? then 1 else 0 end), 0) as eligible,
      coalesce(sum(case when u.created_at <= ? and p.onboarded_at is not null then 1 else 0 end), 0)
        as onboarded,
      coalesce(sum(case when u.created_at <= ? and exists (
        select 1 from user_recipes r where r.user_id = u.id
      ) then 1 else 0 end), 0) as first_recipe,
      coalesce(sum(case when u.created_at <= ? and (
        exists (select 1 from saved_recipes s where s.user_id = u.id)
        or exists (select 1 from meal_recipes m where m.user_id = u.id)
      ) then 1 else 0 end), 0) as kept_recipe,
      coalesce(sum(case when u.created_at <= ? and exists (
        select 1 from ${ACTIVITY} a
        where a.user_id = u.id and a.at >= u.created_at + 7 * 86400000
          and a.at < u.created_at + 14 * 86400000
      ) then 1 else 0 end), 0) as returned,
      coalesce(sum(case when u.created_at > ? then 1 else 0 end), 0) as recent
    from "user" u
    left join profiles p on p.user_id = u.id`,
    cutoff,
    cutoff,
    cutoff,
    cutoff,
    cutoff,
    cutoff,
  );
  return {
    eligible: Number(row?.eligible ?? 0),
    onboarded: Number(row?.onboarded ?? 0),
    firstRecipe: Number(row?.first_recipe ?? 0),
    keptRecipe: Number(row?.kept_recipe ?? 0),
    returned: Number(row?.returned ?? 0),
    recent: Number(row?.recent ?? 0),
  };
}
