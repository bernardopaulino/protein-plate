import { icon } from "./charts";
import { CSRF_FIELD } from "./csrf";
import { catalogFood, foodName } from "./foods";
import { agoLabel, counted, dateTimeLabel, dayLabel, grams, num } from "./format";
import { escapeHtml } from "./html";
import {
  CATEGORY_LABEL,
  DIET_LABEL,
  EQUIPMENT_LABEL,
  labelOf,
  mealLabel,
  providerLabel,
} from "./labels";
import { pageShell } from "./layout";
import { healthLine } from "./privacy";
import { recipeHref } from "./recipes-page";
import {
  QUERY_MAX_CHARS,
  SAVED_LIMIT,
  USERS_PAGE_SIZE,
  type UserDetail,
  type UserList,
  type UserListParams,
  type UserProfile,
  type UserSort,
} from "./users";
import {
  DASH,
  avatar,
  card,
  cardMeta,
  detailsGrid,
  emptyState,
  moreMenu,
  note,
  pager,
  pill,
  searchField,
  sortHeader,
  tableScroll,
  toolbar,
  type MenuItem,
} from "./ui";

/**
 * As páginas das contas: a lista (pesquisa, ordem pela data e páginas), a ficha de cada pessoa
 * e a confirmação do apagar. A ficha nunca mostra o peso nem as alergias (privacy.ts).
 */

/** O endereço da lista com estes parâmetros (os valores por omissão não aparecem). */
export function usersHref(params: Partial<UserListParams>): string {
  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.sort && params.sort !== "recentes") query.set("ordem", params.sort);
  if (params.page && params.page > 1) query.set("pagina", String(params.page));
  const text = query.toString();
  return text ? `/utilizadores?${text}` : "/utilizadores";
}

export function userHref(id: string): string {
  return `/utilizadores/${encodeURIComponent(id)}`;
}

const onboardingPill = (at: number | null) =>
  at === null ? pill("Onboarding por fazer", "quiet") : pill("Onboarding feito", "ok");

const providersText = (ids: readonly string[]) => ids.map(providerLabel).join(", ") || "—";

/** O formulário de terminar as sessões (no cartão das sessões e no menu da ficha). */
function endSessionsForm(u: UserDetail, csrf: string, buttonClass: string): string {
  const count = u.sessions.active;
  return `<form method="post" action="${escapeHtml(userHref(u.id))}/sessoes"><input type="hidden" name="${CSRF_FIELD}" value="${escapeHtml(csrf)}"><button type="submit" class="${buttonClass}">Terminar ${count === 1 ? "a sessão" : count === 0 ? "todas as sessões" : `as ${num(count)} sessões`}</button></form>`;
}

export function usersPage({
  adminEmail,
  now,
  list,
  params,
  notice = "",
}: {
  adminEmail: string;
  now: number;
  list: UserList;
  params: UserListParams;
  notice?: string;
}): string {
  const first = (list.page - 1) * USERS_PAGE_SIZE + 1;
  const last = first + list.items.length - 1;
  const count =
    list.total === 0
      ? ""
      : `${list.pages > 1 ? `${num(first)}–${num(last)} de ` : ""}${counted(list.total, "conta", "contas")}${params.q ? ` com “${escapeHtml(params.q)}”` : ""}`;
  const filters = toolbar({
    action: "/utilizadores",
    fields: [searchField("Procurar por nome, email ou ID", params.q, QUERY_MAX_CHARS)],
    submit: "Procurar",
    clear: params.q !== "" || params.sort !== "recentes" ? "/utilizadores" : undefined,
    hidden: params.sort === "recentes" ? [] : [{ name: "ordem", value: params.sort }],
    count,
  });
  const rows = list.items
    .map((u, i) => {
      const lastSession =
        u.lastSessionAt === null
          ? DASH
          : `<time datetime="${new Date(u.lastSessionAt).toISOString()}" title="${escapeHtml(dateTimeLabel(u.lastSessionAt))} UTC">${escapeHtml(agoLabel(u.lastSessionAt, now))}</time>`;
      const menu: MenuItem[] = [
        { kind: "link", label: "Abrir a ficha", href: userHref(u.id) },
        { kind: "link", label: "Apagar conta…", href: `${userHref(u.id)}/apagar`, danger: true },
      ];
      return `<tr>
<th scope="row"><a class="person" href="${escapeHtml(userHref(u.id))}">${avatar(u.name)}<span class="person-text"><span class="person-name">${escapeHtml(u.name)}</span><span class="person-email">${escapeHtml(u.email)}</span></span></a></th>
<td>${escapeHtml(dayLabel(u.createdAt, true))}</td>
<td>${escapeHtml(providersText(u.providers))}</td>
<td>${onboardingPill(u.onboardedAt)}</td>
<td class="num">${u.savedRecipes === 0 ? DASH : num(u.savedRecipes)}</td>
<td>${lastSession}</td>
<td class="row-menu">${moreMenu(`linha-${i}`, `Ações para ${u.name}`, menu)}</td>
</tr>`;
    })
    .join("");
  const nextSort: UserSort = params.sort === "recentes" ? "antigas" : "recentes";
  const head = `<thead><tr><th scope="col">Pessoa</th>${sortHeader("Criada", usersHref({ q: params.q, sort: nextSort }), true, { ascending: params.sort === "antigas" })}<th scope="col">Entra com</th><th scope="col">Onboarding</th><th scope="col" class="num">Receitas guardadas</th><th scope="col">Última sessão</th><th scope="col"><span class="visually-hidden">Ações</span></th></tr></thead>`;
  const table =
    list.items.length === 0
      ? params.q
        ? emptyState(
            "users",
            "Nenhuma conta encontrada",
            "Nenhuma conta com esse nome, email ou ID.",
          )
        : emptyState("users", "Ainda sem contas", "Aparecem aqui quando alguém criar conta na app.")
      : tableScroll(
          "Contas",
          `<table class="list wide"><caption class="visually-hidden">Contas, ${params.sort === "recentes" ? "das mais recentes" : "das mais antigas"}</caption>${head}<tbody>${rows}</tbody></table>`,
        );
  return pageShell({
    title: "Utilizadores",
    section: "utilizadores",
    adminEmail,
    now,
    heading: "Utilizadores",
    sub: "As contas, para dar apoio e gerir o serviço.",
    about:
      "<p>A pesquisa procura parte do nome ou do email (o % e o _ contam como texto) ou o ID exato. A ficha de cada pessoa nunca mostra o peso nem as alergias.</p>",
    wide: true,
    notice,
    body: `${filters}
<section class="card card-flush" aria-label="Lista de contas">${table}</section>
${pager(list.page, list.pages, (page) => usersHref({ ...params, page }))}`,
  });
}

const dateOrDash = (ms: number | null) => (ms === null ? DASH : escapeHtml(dateTimeLabel(ms)));

function accountCard(u: UserDetail): string {
  const providers =
    u.providers.length === 0
      ? DASH
      : u.providers
          .map(
            (a) =>
              `${escapeHtml(providerLabel(a.id))} <span class="muted">desde ${escapeHtml(dayLabel(a.createdAt, true))}</span>`,
          )
          .join("<br>");
  const p = u.profile;
  const items: [string, string][] = [
    ["Email", escapeHtml(u.email)],
    ["ID", `<code>${escapeHtml(u.id)}</code>`],
    ["Criada", escapeHtml(dateTimeLabel(u.createdAt))],
    ["Entra com", providers],
    [
      "Onboarding",
      p?.onboardedAt
        ? `Feito a ${escapeHtml(dateTimeLabel(p.onboardedAt))}`
        : `<span class="muted">Por fazer</span>`,
    ],
    [
      "Termos e privacidade",
      p?.consentVersion
        ? `Versão ${num(p.consentVersion)}, a ${dateOrDash(p.consentedAt)}`
        : `<span class="muted">Sem registo</span>`,
    ],
    ["Dados de saúde", escapeHtml(healthLine(p?.healthConsentAt ?? null))],
  ];
  return card({ id: "ficha-conta", title: "Conta", body: detailsGrid(items) });
}

function mealsText(p: UserProfile): string {
  if (p.meals.length === 0) return DASH;
  return p.meals
    .map((meal) => {
      const tags = [
        meal === p.preWorkoutMeal ? "pré-treino" : "",
        meal === p.postWorkoutMeal ? "pós-treino" : "",
      ].filter(Boolean);
      return `${escapeHtml(mealLabel(meal))}${tags.length ? ` <span class="muted">(${tags.join(", ")})</span>` : ""}`;
    })
    .join("<br>");
}

function preferencesCard(p: UserProfile | null): string {
  if (!p) {
    return card({
      id: "ficha-preferencias",
      title: "Preferências",
      body: note("Esta conta ainda não tem perfil: não chegou a guardar a meta nem o onboarding."),
    });
  }
  const training =
    p.preWorkoutMeal === null && p.postWorkoutMeal === null
      ? "Sem refeições à volta do treino"
      : [
          p.preWorkoutMeal ? `Pré-treino ao ${mealLabel(p.preWorkoutMeal).toLowerCase()}` : "",
          p.postWorkoutMeal ? `pós-treino ao ${mealLabel(p.postWorkoutMeal).toLowerCase()}` : "",
        ]
          .filter(Boolean)
          .join(", ");
  const items: [string, string][] = [
    ["Meta diária", `<strong>${escapeHtml(grams(p.dailyTargetG))}</strong> de proteína`],
    ["Refeições", `${num(p.meals.length)} por dia<br>${mealsText(p)}`],
    ["Treino", escapeHtml(training.charAt(0).toUpperCase() + training.slice(1))],
    ["Alimentação", escapeHtml(labelOf(DIET_LABEL, p.diet))],
    [
      "Equipamento",
      p.equipment.length === 0
        ? DASH
        : escapeHtml(p.equipment.map((e) => labelOf(EQUIPMENT_LABEL, e)).join(", ")),
    ],
    ["Tempo para cozinhar", `Até ${num(p.cookMinutes)} min`],
    ["Língua", p.locale === "en" ? "Inglês" : "Português"],
    ["Perfil atualizado", escapeHtml(dateTimeLabel(p.updatedAt))],
  ];
  return card({ id: "ficha-preferencias", title: "Preferências", body: detailsGrid(items) });
}

function likedFoodsCard(p: UserProfile | null): string {
  const foods = p?.likedFoods ?? [];
  const body =
    foods.length === 0
      ? note("Ainda sem alimentos escolhidos.")
      : `<ul class="chips">${foods
          .map((id) => {
            const food = catalogFood(id);
            const title = food ? CATEGORY_LABEL[food.category] : "Fora do catálogo";
            return `<li class="chip" title="${escapeHtml(title)}">${escapeHtml(foodName(id))}</li>`;
          })
          .join("")}</ul>`;
  return card({
    id: "ficha-alimentos",
    title: "Alimentos de que gosta",
    aside: foods.length ? cardMeta(counted(foods.length, "alimento", "alimentos")) : "",
    body,
  });
}

function savedCard(u: UserDetail): string {
  const body =
    u.saved.length === 0
      ? note("Sem receitas guardadas.")
      : `<ul class="short-list">${u.saved
          .map(
            (r) =>
              `<li><a href="${escapeHtml(recipeHref(r.id))}"><span class="short-main"><span class="short-title">${escapeHtml(r.title)}</span><span class="short-sub">${escapeHtml(mealLabel(r.meal))} · ${escapeHtml(grams(r.proteinPerServingG))} por dose · guardada a ${escapeHtml(dayLabel(r.savedAt, true))}</span></span>${icon("arrow-right")}</a></li>`,
          )
          .join(
            "",
          )}</ul>${u.savedTotal > u.saved.length ? `<p class="card-foot">As ${num(SAVED_LIMIT)} mais recentes de ${num(u.savedTotal)}.</p>` : ""}`;
  return card({
    id: "ficha-receitas",
    title: "Receitas guardadas",
    aside: cardMeta(counted(u.savedTotal, "receita", "receitas")),
    body,
    flush: u.saved.length > 0,
  });
}

function sessionsCard(u: UserDetail, csrf: string, now: number): string {
  const s = u.sessions;
  const items: [string, string][] = [
    ["Sessões ativas", num(s.active)],
    [
      "Última entrada",
      s.lastCreatedAt === null
        ? DASH
        : `${escapeHtml(dateTimeLabel(s.lastCreatedAt))} <span class="muted">(${escapeHtml(agoLabel(s.lastCreatedAt, now))})</span>`,
    ],
    ["Última atividade", dateOrDash(s.lastSeenAt)],
  ];
  const action =
    s.active === 0
      ? ""
      : `<div class="action">${endSessionsForm(u, csrf, "button button-secondary")}<p class="action-hint">A app pede para entrar de novo no próximo pedido. Os dados ficam.</p></div>`;
  return card({
    id: "ficha-sessoes",
    title: "Sessões",
    body: `${detailsGrid(items)}<p class="panel-sub">Sem IP nem dispositivo: as sessões não os guardam.</p>${action}`,
  });
}

function dangerCard(u: UserDetail): string {
  return card({
    id: "ficha-apagar",
    title: "Apagar a conta",
    body: `<p class="panel-sub">Apaga a conta e todos os dados no servidor, como o “Apagar conta” da app (a pedido da pessoa). Pede confirmação.</p><p class="action"><a class="button button-danger" href="${escapeHtml(userHref(u.id))}/apagar">${icon("attention")}<span>Apagar conta…</span></a></p>`,
  });
}

export function userPage({
  adminEmail,
  now,
  user,
  csrf,
  notice = "",
}: {
  adminEmail: string;
  now: number;
  user: UserDetail;
  csrf: string;
  notice?: string;
}): string {
  const menu: MenuItem[] = [
    ...(user.sessions.active > 0
      ? [{ kind: "form", html: endSessionsForm(user, csrf, "menu-item") } as const]
      : []),
    { kind: "link", label: "Apagar conta…", href: `${userHref(user.id)}/apagar`, danger: true },
  ];
  return pageShell({
    title: user.name,
    section: "utilizadores",
    adminEmail,
    now,
    heading: user.name,
    leading: avatar(user.name, "large"),
    badges: onboardingPill(user.profile?.onboardedAt ?? null),
    sub: `${escapeHtml(user.email)} · conta criada a ${escapeHtml(dayLabel(user.createdAt, true))} · ${escapeHtml(providersText(user.providers.map((p) => p.id)))}`,
    about:
      "<p>Os dados de saúde (o peso e as alergias) nunca aparecem por pessoa: só se há dados guardados e desde quando há consentimento. A intensidade do treino também não aparece (com a meta, dava o peso).</p>",
    aside: `<a class="button button-secondary" href="/utilizadores">Todos os utilizadores</a>${moreMenu("ficha-acoes", "Ações da conta", menu)}`,
    notice,
    body: `<div class="grid grid-split">${accountCard(user)}
${sessionsCard(user, csrf, now)}</div>
<div class="grid grid-split">${preferencesCard(user.profile)}
${likedFoodsCard(user.profile)}</div>
${savedCard(user)}
${dangerCard(user)}`,
  });
}

export function deletePage({
  adminEmail,
  now,
  user,
  csrf,
  error = false,
}: {
  adminEmail: string;
  now: number;
  user: UserDetail;
  csrf: string;
  error?: boolean;
}): string {
  const errorId = "confirmar-erro";
  const what = [
    user.profile ? "o perfil (a meta e as preferências, incluindo os dados de saúde)" : "",
    user.planItems > 0
      ? `o dia guardado (${counted(user.planItems, "alimento", "alimentos")})`
      : "",
    counted(user.savedTotal, "receita guardada", "receitas guardadas"),
    counted(user.sessions.active, "sessão", "sessões"),
    user.providers.length > 0
      ? `as formas de entrar (${providersText(user.providers.map((p) => p.id))})`
      : "",
  ].filter(Boolean);
  return pageShell({
    title: `Apagar ${user.name}`,
    section: "utilizadores",
    adminEmail,
    now,
    heading: `Apagar a conta de ${user.name}`,
    crumbs: [{ label: user.name, href: userHref(user.id) }],
    crumb: "Apagar conta",
    body: `<section class="card confirm" aria-labelledby="apagar-titulo">
<h2 id="apagar-titulo" class="confirm-title">${icon("attention")}<span>Isto não dá para desfazer</span></h2>
<p>Apaga a conta de <strong>${escapeHtml(user.email)}</strong> e tudo o que está no servidor: ${escapeHtml(what.join(", "))}.</p>
<p class="panel-sub">As receitas geradas ficam (não têm dono). Numa conta da Apple, a ligação ao Apple ID fica até a pessoa a tirar nas definições do iPhone (a revogação só a app a faz, com o segredo do Better Auth). Os contadores das quotas não se ligam à pessoa e o cron apaga-os em 2 dias. As cópias do Time Travel da D1 expiram em até 30 dias.</p>
<form class="action" method="post" action="${escapeHtml(userHref(user.id))}/apagar">
<input type="hidden" name="${CSRF_FIELD}" value="${escapeHtml(csrf)}">
<label for="confirmar">Para confirmar, escreve o email da conta</label>
<input id="confirmar" name="confirmar" type="text" autocomplete="off" spellcheck="false" required${error ? ` aria-invalid="true" aria-describedby="${errorId}"` : ""}>
${error ? `<p class="field-error" id="${errorId}">O email não é o desta conta. Nada foi apagado.</p>` : ""}
<div class="action-row"><button type="submit" class="button button-danger">${icon("attention")}<span>Apagar conta e dados</span></button><a class="link-button" href="${escapeHtml(userHref(user.id))}">Cancelar</a></div>
</form>
</section>`,
  });
}
