import { icon, type IconName } from "./charts";
import { FAVICON_SVG } from "./favicon";
import { timeLabel } from "./format";
import { escapeHtml } from "./html";
import { MIN_GROUP } from "./privacy";
import { alertBanner, avatar } from "./ui";

/**
 * A moldura das páginas, gerada no servidor: sem JavaScript e sem estilos inline (a CSP
 * recusa-os). Como no backoffice do Rejection Quest, uma barra lateral (a marca, as secções com
 * ícones e quem entrou, com o seu menu) e, ao lado, o conteúdo, com uma barra presa no topo (o
 * caminho e a hora da leitura), o título da página e o rodapé com o que o backoffice mostra e
 * não mostra. No telemóvel e no tablet, a barra lateral abre como gaveta pelo botão da barra do
 * topo (o atributo `popover` do HTML).
 */

export type Section = "painel" | "utilizadores" | "receitas" | "alimentos";

const SECTIONS: Record<Section, { label: string; href: string; icon: IconName }> = {
  painel: { label: "Painel", href: "/", icon: "panel" },
  utilizadores: { label: "Utilizadores", href: "/utilizadores", icon: "users" },
  receitas: { label: "Receitas", href: "/receitas", icon: "recipe" },
  alimentos: { label: "Alimentos", href: "/alimentos", icon: "food" },
};

/** As secções na barra lateral: o Painel solto no topo e as outras em grupos com nome. */
const NAV_GROUPS: readonly { id: string; label: string | null; sections: readonly Section[] }[] = [
  { id: "geral", label: null, sections: ["painel"] },
  { id: "contas", label: "Contas", sections: ["utilizadores"] },
  { id: "conteudo", label: "Conteúdo", sections: ["receitas", "alimentos"] },
];

/** O logótipo: o ícone da app (o mesmo do separador), decorativo ao lado do nome. */
const BRAND_MARK = FAVICON_SVG.trim().replace(
  "<svg ",
  '<svg class="brand-mark" aria-hidden="true" focusable="false" ',
);

export function document(title: string, body: string): string {
  return `<!doctype html>
<html lang="pt-PT">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light">
<title>${escapeHtml(title)}</title>
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/styles.css">
</head>
<body>
${body}
</body>
</html>
`;
}

/** Uma página só com uma mensagem (sem acesso, por configurar, não encontrada, erro). */
export function messagePage(title: string, text: string): string {
  return document(
    `${title} · Backoffice`,
    `<main class="message"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(text)}</p></main>`,
  );
}

/** Um aviso no topo da página, depois de uma ação (role="status": os leitores de ecrã leem-no). */
export function flash(text: string): string {
  return alertBanner(text, "", "ok", { live: true });
}

export interface ShellOptions {
  /** O título no separador do navegador. */
  title: string;
  section: Section;
  adminEmail: string;
  now: number;
  /** O título da página (h1). */
  heading: string;
  /** Uma linha por baixo do título (HTML já escapado). */
  sub?: string;
  /** O que explica os dados da página, aberto a pedido (HTML já escapado). */
  about?: string;
  /** O caminho até à página, entre a secção e a própria página (ex.: a ficha antes do apagar). */
  crumbs?: readonly { label: string; href: string }[];
  /** O nome da própria página no caminho, se não for o título (ex.: "Apagar conta"). */
  crumb?: string;
  /** Listas: o conteúdo ocupa a largura toda, para as tabelas largas. */
  wide?: boolean;
  /** À esquerda do título: a inicial de uma ficha (HTML já feito). */
  leading?: string;
  /** Ao lado do título: as pílulas de estado de uma ficha (HTML já feito). */
  badges?: string;
  /** À direita do título: os botões e o menu da página (HTML já feito). */
  aside?: string;
  /** Um aviso depois de uma ação (flash). */
  notice?: string;
  body: string;
}

/** O caminho na barra do topo: o Painel, a secção, o que houver pelo meio e a página. */
function trail(
  section: Section,
  heading: string,
  crumbs: readonly { label: string; href: string }[],
  crumb: string | undefined,
): string {
  const links: { label: string; href: string }[] = [];
  if (section !== "painel") links.push({ label: "Painel", href: "/" });
  const top = SECTIONS[section];
  const here = crumb ?? heading;
  if (here !== top.label) links.push({ label: top.label, href: top.href });
  links.push(...crumbs);
  const items = links
    .map((c) => `<li><a href="${escapeHtml(c.href)}">${escapeHtml(c.label)}</a></li>`)
    .join("");
  return `<nav class="crumbs" aria-label="Caminho"><ol>${items}<li><span aria-current="page">${escapeHtml(here)}</span></li></ol></nav>`;
}

/** Quem entrou, no fundo da barra lateral, com o menu da conta. */
function account(adminEmail: string): string {
  const local = adminEmail === "local";
  const name = local ? "Local (sem Access)" : adminEmail;
  const items = [
    `<p class="menu-label">${local ? "Local, sem o Cloudflare Access" : `Entraste como ${escapeHtml(adminEmail)}`}</p>`,
    `<a class="menu-item" href="#rodape">O que o backoffice mostra</a>`,
    // O fim da sessão do Access (no próprio domínio): em local não há sessão a terminar
    local
      ? ""
      : `<a class="menu-item" href="/cdn-cgi/access/logout">${icon("logout")}<span>Terminar sessão</span></a>`,
  ].join("");
  return `<div class="account">
<button type="button" class="account-button" popovertarget="conta-menu">${avatar(local ? "L" : adminEmail)}<span class="account-text"><span class="account-name">${escapeHtml(name)}</span><span class="account-sub">${local ? "Desenvolvimento" : "Cloudflare Access"}</span></span>${icon("chevrons")}</button>
<div class="menu account-menu" id="conta-menu" popover>${items}</div>
</div>`;
}

const FOOTER = `<footer class="foot" id="rodape"><details><summary>O que o backoffice mostra e não mostra</summary><p>Contas, preferências, receitas e números do serviço, para o gerir e dar apoio. Os dados de saúde (o peso e as alergias) nunca aparecem por pessoa: a ficha diz só se há dados de saúde guardados e desde quando há consentimento. As alergias só aparecem no Painel, em contagens por alergénio, e só a partir de ${MIN_GROUP} pessoas (abaixo disso, “&lt;${MIN_GROUP}”). A intensidade do treino também não aparece na ficha (com a meta, dava o peso). As sessões não guardam IP nem dispositivo. Horas, dias e semanas (de segunda a domingo) em UTC.</p></details></footer>`;

export function pageShell({
  title,
  section,
  adminEmail,
  now,
  heading,
  sub = "",
  about = "",
  crumbs = [],
  crumb,
  wide = false,
  leading = "",
  badges = "",
  aside = "",
  notice = "",
  body,
}: ShellOptions): string {
  const aboutBlock = about
    ? `<details class="about"><summary>Sobre estes dados</summary><div class="about-body">${about}</div></details>`
    : "";
  const iso = `${new Date(now).toISOString().slice(0, 16)}Z`;
  const groups = NAV_GROUPS.map((group) => {
    const items = group.sections
      .map((id) => {
        const s = SECTIONS[id];
        const inner = `${icon(s.icon)}<span>${escapeHtml(s.label)}</span>`;
        return id === section
          ? `<li><a href="${s.href}" aria-current="page">${inner}</a></li>`
          : `<li><a href="${s.href}">${inner}</a></li>`;
      })
      .join("");
    return group.label === null
      ? `<div class="nav-group"><ul>${items}</ul></div>`
      : `<div class="nav-group"><p class="nav-label" id="nav-${group.id}">${escapeHtml(group.label)}</p><ul aria-labelledby="nav-${group.id}">${items}</ul></div>`;
  }).join("");
  const titleRow = badges
    ? `<div class="title-row"><h1>${escapeHtml(heading)}</h1>${badges}</div>`
    : `<h1>${escapeHtml(heading)}</h1>`;
  return document(
    `${title} · Backoffice · Protein Plate`,
    `<a class="skip" href="#conteudo">Saltar para o conteúdo</a>
<div class="shell">
<div class="sidebar" id="barra" popover>
<div class="sidebar-head"><a href="/" class="brand">${BRAND_MARK}<span class="brand-text"><span class="brand-name">Protein Plate</span><span class="brand-sub">Backoffice</span></span></a><button type="button" class="icon-button sidebar-close" popovertarget="barra" popovertargetaction="hide" aria-label="Fechar o menu">${icon("close")}</button></div>
<nav class="nav" aria-label="Secções do backoffice">${groups}</nav>
${account(adminEmail)}
</div>
<div class="inset">
<header class="topbar">
<button type="button" class="icon-button topbar-menu" popovertarget="barra" aria-label="Abrir o menu">${icon("menu")}</button>
${trail(section, heading, crumbs, crumb)}
<p class="topbar-meta"><time datetime="${iso}">Lido às ${timeLabel(now)} UTC</time></p>
</header>
<main id="conteudo" tabindex="-1" class="content${wide ? " content-wide" : ""}">
<div class="page-head">${leading}<div class="page-title">${titleRow}${sub ? `<p class="page-sub">${sub}</p>` : ""}${aboutBlock}</div>${aside ? `<div class="page-actions">${aside}</div>` : ""}</div>
${notice}
${body}
${FOOTER}
</main>
</div>
</div>`,
  );
}
