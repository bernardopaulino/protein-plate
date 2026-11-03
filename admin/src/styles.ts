/**
 * CSS do backoffice: a organização do backoffice do Rejection Quest (barra lateral, conteúdo num
 * cartão com uma barra presa no topo, cartões de linha fina, sem sombras) com os tokens do
 * Protein Plate (src/app/globals.css, secção 11 da especificação): tons quentes, o verde
 * #2F6B3A como tinta dos dados e das ações, o âmbar só em fundos. Sempre em modo claro: é uma
 * ferramenta de trabalho. Letra do sistema a 14 px (a CSP não carrega fontes), números
 * tabulares, controlos de 36 px (44 px ao toque) e foco sempre visível. O vermelho só no que
 * apaga uma conta, nunca ligado à nutrição.
 */
export const STYLES = `:root {
  color-scheme: light;
  /* Os tokens da app (claro) */
  --bg: #fbf8f3;
  --surface: #ffffff;
  --text: #1f1b16;
  --text-muted: #6b6258;
  --primary: #2f6b3a;
  --on-primary: #ffffff;
  --accent: #f2b33d;
  --track: #eae3d8;
  --danger: #b3261e;
  --border: #e3d9cb;
  --primary-soft: #e3efe2;
  /* Só do backoffice, na mesma família */
  --surface-sunken: #f5f0e8;
  --primary-hover: #255830;
  /* A coluna do dia ou da semana em curso (3,7:1 no branco) */
  --primary-partial: #5e8f68;
  --attention-text: #7a4f00;
  --attention-soft: #fcf0d6;
  --danger-soft: #fbe9e7;
  --radius-card: 16px;
  --radius-inner: 10px;
  --control: 36px;
}
@media (pointer: coarse) {
  :root {
    --control: 44px;
  }
}
*,
*::before,
*::after {
  box-sizing: border-box;
}
html {
  -webkit-text-size-adjust: 100%;
  text-size-adjust: 100%;
}
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font: 14px/1.5 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}
h1,
h2,
h3,
p,
ul,
ol,
dl,
dd,
figure {
  margin: 0;
}
ul,
ol {
  padding: 0;
  list-style: none;
}
h1,
h2,
h3 {
  letter-spacing: -0.01em;
  text-wrap: balance;
}
p {
  text-wrap: pretty;
}
a {
  color: inherit;
  text-underline-offset: 0.2em;
}
::selection {
  background: var(--primary-soft);
}
:focus-visible {
  outline: 3px solid var(--primary);
  outline-offset: 2px;
  border-radius: 6px;
}
code {
  font: 0.92em/1.2 ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
  overflow-wrap: anywhere;
}
/* Nas tabelas, um modelo ou um ID fica numa linha (a tabela desloca-se) */
th code,
td code {
  overflow-wrap: normal;
  white-space: nowrap;
}
strong {
  font-weight: 650;
}
.muted {
  color: var(--text-muted);
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.skip {
  position: absolute;
  top: 12px;
  left: 16px;
  z-index: 50;
  padding: 10px 14px;
  border-radius: 10px;
  background: var(--primary);
  color: var(--on-primary);
  font-weight: 600;
  text-decoration: none;
  transform: translateY(-200%);
}
.skip:focus {
  transform: none;
}
.icon {
  display: block;
  flex: none;
  width: 16px;
  height: 16px;
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
  }
}

/* Moldura: a barra lateral e, ao lado, o conteúdo. No telemóvel e no tablet, o conteúdo ocupa o
   ecrã e a barra lateral abre como gaveta (popover), por cima dele */
.shell {
  min-height: 100vh;
  min-height: 100dvh;
}
.inset {
  min-width: 0;
  min-height: 100vh;
  min-height: 100dvh;
  background: var(--bg);
}
.sidebar {
  flex-direction: column;
  gap: 18px;
  padding: 12px 10px 10px;
  background: var(--surface);
  color: var(--text);
}
.sidebar[popover] {
  inset: 0 auto 0 0;
  width: min(280px, 86vw);
  height: 100%;
  max-height: none;
  margin: 0;
  border: 0;
  border-right: 1px solid var(--border);
  overflow-y: auto;
}
.sidebar:popover-open {
  display: flex;
}
.sidebar::backdrop {
  background: rgb(31 27 22 / 0.32);
}
@media (min-width: 1000px) {
  .shell {
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr);
  }
  /* No computador a barra está sempre à vista (o popover só serve à gaveta) */
  .sidebar,
  .sidebar[popover] {
    position: sticky;
    top: 0;
    inset: auto;
    display: flex;
    width: auto;
    height: 100vh;
    height: 100dvh;
    border: 0;
    border-right: 1px solid var(--border);
  }
  .sidebar::backdrop {
    display: none;
  }
}

/* A barra do topo: presa, com o botão da gaveta, o caminho e a hora da leitura */
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 56px;
  padding: 0 12px;
  border-bottom: 1px solid var(--border);
  background: rgb(251 248 243 / 0.9);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}
@media (min-width: 1000px) {
  .topbar {
    padding: 0 28px;
  }
  .topbar .topbar-menu,
  .sidebar-head .sidebar-close {
    display: none;
  }
}
.crumbs {
  min-width: 0;
}
.crumbs ol {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}
.crumbs li {
  display: flex;
  align-items: center;
  min-width: 0;
}
.crumbs li + li::before {
  content: "";
  width: 6px;
  height: 6px;
  margin: 0 10px 0 6px;
  border-top: 1.5px solid var(--text-muted);
  border-right: 1.5px solid var(--text-muted);
  transform: rotate(45deg);
}
.crumbs a {
  display: inline-block;
  padding: 4px 0;
  color: var(--text-muted);
  text-decoration: none;
}
.crumbs a:hover {
  color: var(--text);
  text-decoration: underline;
}
.crumbs [aria-current] {
  overflow: hidden;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topbar-meta {
  flex: none;
  margin-left: auto;
  color: var(--text-muted);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}
@media (max-width: 519.98px) {
  .topbar-meta {
    display: none;
  }
}
.content {
  max-width: 1320px;
  padding: 20px 16px 40px;
}
.content-wide {
  max-width: none;
}
@media (min-width: 720px) {
  .content {
    padding: 28px 28px 48px;
  }
}
main:focus {
  outline: none;
}

/* Botões só com ícone (a gaveta, o "⋯") */
.icon-button {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: var(--control);
  height: var(--control);
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--text-muted);
  font: inherit;
  cursor: pointer;
}
.icon-button:hover {
  background: var(--surface-sunken);
  color: var(--text);
}

/* Marca: o ícone da app, o nome e "Backoffice" por baixo */
.sidebar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 2px 0 6px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  border-radius: 10px;
  color: inherit;
  text-decoration: none;
}
.brand-mark {
  display: block;
  flex: none;
  width: 32px;
  height: 32px;
}
.brand-text {
  display: grid;
  line-height: 1.2;
}
.brand-name {
  font-size: 15px;
  font-weight: 700;
}
.brand-sub {
  color: var(--text-muted);
  font-size: 12px;
}

/* As secções; a escolhida a negrito, num fundo verde-claro e com a barra à esquerda */
.nav {
  display: grid;
  gap: 18px;
}
.nav-label {
  padding: 0 10px 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.nav-group ul {
  display: grid;
  gap: 2px;
}
.nav a {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: var(--control);
  padding: 0 10px;
  border-radius: 10px;
  color: var(--text);
  text-decoration: none;
}
.nav a .icon {
  color: var(--text-muted);
}
.nav a:hover {
  background: var(--surface-sunken);
}
.nav a[aria-current="page"] {
  background: var(--primary-soft);
  font-weight: 650;
}
.nav a[aria-current="page"]::before {
  content: "";
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 0;
  width: 3px;
  border-radius: 2px;
  background: var(--primary);
}
.nav a[aria-current="page"] .icon {
  color: var(--primary);
}

/* Quem entrou, no fundo da barra, com o seu menu */
.account {
  margin-top: auto;
}
.account-button {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 48px;
  padding: 6px 8px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.account-button:hover {
  background: var(--surface-sunken);
}
.account-button > .icon {
  color: var(--text-muted);
}
.account-text {
  display: grid;
  flex: 1;
  min-width: 0;
  line-height: 1.25;
}
.account-name {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.account-sub {
  color: var(--text-muted);
  font-size: 12px;
}

/* A inicial de uma pessoa */
.avatar {
  display: inline-grid;
  place-items: center;
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 12.5px;
  font-weight: 700;
  line-height: 1;
}
.avatar-large {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  font-size: 20px;
}

/* Menus (popover): o da conta, o "⋯" das linhas e o das fichas. Onde o navegador sabe ancorar
   o menu ao botão, abre por baixo dele; nos outros, ao centro do ecrã */
.menu {
  min-width: 210px;
  max-width: min(320px, calc(100vw - 32px));
  margin: auto;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  color: var(--text);
}
@supports (position-area: bottom) {
  .menu {
    inset: auto;
    margin: 4px 0;
    position-area: bottom span-left;
    position-try-fallbacks: flip-block;
  }
  .account-menu {
    margin: 0 0 4px;
    position-area: top span-right;
  }
}
.menu:popover-open {
  display: grid;
}
.menu-label {
  margin-bottom: 4px;
  padding: 8px 10px 6px;
  border-bottom: 1px solid var(--track);
  color: var(--text-muted);
  font-size: 12.5px;
  overflow-wrap: anywhere;
}
.menu form {
  display: grid;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: var(--control);
  padding: 0 10px;
  border: 0;
  border-radius: 8px;
  background: none;
  color: var(--text);
  font: inherit;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
}
.menu-item:hover {
  background: var(--surface-sunken);
}
.menu-danger {
  color: var(--danger);
}
.menu-danger:hover {
  background: var(--danger-soft);
}

/* O cabeçalho de cada página: a inicial, o título com as pílulas, a linha e os botões */
.page-head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 14px 16px;
  margin-bottom: 22px;
}
.page-title {
  flex: 1 1 320px;
  min-width: 0;
}
.title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}
h1 {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
  overflow-wrap: anywhere;
}
.page-sub {
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 14.5px;
  overflow-wrap: anywhere;
}
.page-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.about {
  margin-top: 8px;
  color: var(--text-muted);
}
.about summary,
.data summary,
.foot summary {
  width: fit-content;
  min-height: 32px;
  padding: 4px 0;
  color: var(--primary);
  font-weight: 600;
  cursor: pointer;
}
.about-body {
  max-width: 72ch;
  padding: 4px 0 2px;
}

/* Avisos em faixa (depois de uma ação, o porquê de uma ficha limitada) */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 18px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-inner);
  background: var(--surface);
}
.alert > .icon {
  margin-top: 2px;
}
.alert-ok {
  border-color: #c4dcc5;
  background: var(--primary-soft);
}
.alert-ok > .icon {
  color: var(--primary);
}
.alert-attention {
  border-color: #efd59b;
  background: var(--attention-soft);
}
.alert-attention > .icon {
  color: var(--attention-text);
}
.alert-title {
  font-weight: 600;
}
.alert-text p + p {
  margin-top: 2px;
  color: var(--text-muted);
}

/* A faixa de números do Painel */
.strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  overflow: hidden;
  margin-bottom: 28px;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--surface);
}
/* As divisórias: uma linha à direita e por baixo de cada célula (as das bordas ficam por baixo
   da borda da faixa); uma célula a menos na última fila deixa só fundo branco */
.strip-cell {
  min-width: 0;
  padding: 16px 18px 18px;
  box-shadow:
    1px 0 0 var(--border),
    0 1px 0 var(--border);
}
.strip-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}
.strip-label .icon {
  color: var(--primary);
}
.strip-figure {
  margin: 8px 0 6px;
  font-size: 30px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  line-height: 1.1;
}
.strip-line {
  font-size: 13px;
}
.strip-detail {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 12.5px;
}

/* Os blocos do Painel */
.row {
  margin-bottom: 32px;
}
.row-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 12px;
  margin-bottom: 12px;
}
.row-head h2 {
  font-size: 18px;
  font-weight: 700;
}
.row-sub {
  color: var(--text-muted);
}

/* Grelhas de cartões */
.grid {
  display: grid;
  align-items: start;
  gap: 16px;
  margin-bottom: 16px;
}
.grid:last-child {
  margin-bottom: 0;
}
@media (min-width: 820px) {
  .grid-2,
  .grid-split {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .grid-3 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (min-width: 1180px) {
  .grid-split {
    grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  }
  .grid-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.grid > .card,
.grid > article {
  margin-bottom: 0;
}

/* Cartões: branco, linha fina, título num cabeçalho e, à direita, um link ou uma nota */
.card {
  min-width: 0;
  margin-bottom: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  background: var(--surface);
}
/* O conteúdo de um cartão: com margens; as tabelas e o rodapé vão até às bordas */
.card-body {
  padding: 0 18px 18px;
}
.card-body > .table-scroll {
  margin: 0 -18px;
}
.card-body > .card-foot {
  margin: 16px -18px -18px;
}
.card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 6px 12px;
  min-height: 52px;
  padding: 12px 18px;
}
.card-head h2,
.card-head h3 {
  font-size: 15px;
  font-weight: 650;
}
.card-meta {
  color: var(--text-muted);
  font-size: 13px;
}
.card-section {
  padding: 4px 18px 8px;
}
.section-title {
  color: var(--text-muted);
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.card-foot {
  padding: 12px 18px;
  border-top: 1px solid var(--track);
  color: var(--text-muted);
  font-size: 13px;
}
.panel-sub {
  margin-bottom: 12px;
  color: var(--text-muted);
}
.note {
  padding: 2px 0;
  color: var(--text-muted);
}
.card-flush > .note {
  padding: 0 18px 18px;
}

/* Números soltos num cartão (as receitas guardadas, os dados de saúde) */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px 18px;
  margin-bottom: 16px;
}
.stat-value {
  font-size: 24px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.15;
}
.stat-label {
  margin-top: 2px;
  color: var(--text-muted);
  font-size: 13px;
}
.big-figure {
  margin-bottom: 2px;
  font-size: 30px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* Gráficos de colunas: a escala à esquerda, as colunas e as datas por baixo */
.chart-body {
  padding: 0 18px 14px;
}
.chart-sub {
  margin-bottom: 14px;
  color: var(--text-muted);
}
.plot {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 8px;
}
.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 120px;
  color: var(--text-muted);
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.y-axis span {
  line-height: 1;
}
.plot-area {
  min-width: 0;
}
.columns {
  display: block;
  overflow: visible;
}
.columns .mark,
.hbar .mark {
  fill: var(--primary);
}
.columns .mark.partial {
  fill: var(--primary-partial);
}
.columns .hit {
  fill: transparent;
}
.columns g:hover .hit {
  fill: var(--surface-sunken);
}
.columns g:hover .mark {
  fill: var(--primary-hover);
}
.columns .gridline {
  stroke: var(--track);
  stroke-width: 1;
  stroke-dasharray: 2 3;
}
.columns .baseline {
  stroke: var(--border);
  stroke-width: 1;
}
.axis {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 11.5px;
}
.data {
  margin-top: 10px;
}
.data .table-scroll {
  margin-top: 6px;
  border: 1px solid var(--track);
  border-radius: var(--radius-inner);
}

/* Listas de barras horizontais (as distribuições e os alimentos) */
.bars {
  display: grid;
  gap: 2px;
}
.bars li {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(60px, 1fr) auto;
  align-items: center;
  gap: 12px;
  min-height: 36px;
  padding: 4px 0;
}
.bar-label {
  display: grid;
  min-width: 0;
  line-height: 1.3;
}
.bar-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.bar-sub {
  color: var(--text-muted);
  font-size: 12px;
}
.hbar {
  display: block;
}
.hbar .track {
  fill: var(--track);
}
.bar-value {
  min-width: 4.5em;
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
}

/* Tabelas */
/* O contentor das tabelas desloca-se na horizontal (a página nunca); é também o bloco dos textos
   só para leitores de ecrã das células, que de outra forma alargavam a página */
.table-scroll {
  position: relative;
  overflow-x: auto;
  max-width: 100%;
}
.table-scroll:focus-visible {
  outline-offset: -3px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-variant-numeric: tabular-nums;
}
caption {
  padding: 10px 18px 8px;
  color: var(--text-muted);
  font-size: 12.5px;
  text-align: left;
}
th,
td {
  padding: 10px 18px;
  border-top: 1px solid var(--track);
  text-align: left;
  vertical-align: middle;
}
thead th {
  border-top: 0;
  background: var(--surface-sunken);
  color: var(--text-muted);
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
}
tbody th {
  font-weight: 500;
}
tfoot th,
tfoot td {
  font-weight: 650;
}
.num {
  text-align: right;
  white-space: nowrap;
}
td.zero {
  color: var(--text-muted);
}
table.wide {
  min-width: 860px;
}
table.list tbody tr:hover {
  background: #fdfbf7;
}
table.list th a,
.short-list a {
  text-decoration: none;
}
table.list th a:hover {
  text-decoration: underline;
}
.sortable a {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: inherit;
  text-decoration: none;
}
.sortable a:hover {
  color: var(--text);
}
.sortable .icon {
  width: 14px;
  height: 14px;
  opacity: 0.55;
}
.sortable[aria-sort] a {
  color: var(--text);
}
.sortable[aria-sort] .icon {
  opacity: 1;
}
.sortable .icon.is-up {
  transform: rotate(180deg);
}
.person {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.person-text {
  display: grid;
  min-width: 0;
  line-height: 1.3;
}
.person-name {
  font-weight: 600;
}
.person-email {
  color: var(--text-muted);
  font-size: 12.5px;
  overflow-wrap: anywhere;
}
.person:hover .person-name {
  text-decoration: underline;
}
.row-menu {
  width: 1%;
  padding-top: 4px;
  padding-bottom: 4px;
  text-align: right;
}

/* Pílulas de estado: o ponto reforça a palavra, nunca a substitui */
.pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px 2px 8px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.6;
  white-space: nowrap;
}
.pill-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--text-muted);
}
.pill-ok {
  border-color: #c4dcc5;
  background: var(--primary-soft);
}
.pill-ok .pill-dot {
  background: var(--primary);
}
.pill-attention {
  border-color: #efd59b;
  background: var(--attention-soft);
  color: var(--attention-text);
}
.pill-attention .pill-dot {
  background: var(--accent);
}
.pill-quiet {
  color: var(--text-muted);
}
.pill-quiet .pill-dot {
  background: var(--border);
}

/* A barra por cima das listas: a pesquisa, os filtros e quantos aparecem */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px 16px;
  margin-bottom: 14px;
}
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.field-search {
  flex: 1 1 280px;
}
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: var(--control);
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text-muted);
}
.search-box:focus-within {
  border-color: var(--primary);
  outline: 2px solid var(--primary-soft);
}
.search-box input {
  flex: 1;
  min-width: 12em;
  height: calc(var(--control) - 2px);
  border: 0;
  background: none;
  color: var(--text);
  font: inherit;
  outline: none;
}
.select select {
  min-height: var(--control);
  padding: 0 32px 0 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}
.filter-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}
.result-count {
  color: var(--text-muted);
  font-variant-numeric: tabular-nums;
}

/* Botões: a tinta cheia só nas ações */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: var(--control);
  padding: 0 14px;
  border: 1px solid var(--primary);
  border-radius: 10px;
  background: var(--primary);
  color: var(--on-primary);
  font: inherit;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
}
.button:hover {
  border-color: var(--primary-hover);
  background: var(--primary-hover);
}
.button-secondary {
  border-color: var(--border);
  background: var(--surface);
  color: var(--text);
}
.button-secondary:hover {
  border-color: var(--text-muted);
  background: var(--surface-sunken);
}
.button-danger {
  border-color: var(--danger);
  background: var(--danger);
  color: #ffffff;
}
.button-danger:hover {
  border-color: #8f1e18;
  background: #8f1e18;
}
.link-button {
  display: inline-flex;
  align-items: center;
  min-height: var(--control);
  padding: 0 10px;
  border-radius: 10px;
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
}
.link-button:hover {
  text-decoration: underline;
}
.arrow-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 32px;
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
}
.arrow-link:hover {
  text-decoration: underline;
}

/* As páginas de uma lista */
.pager {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 4px;
  color: var(--text-muted);
}
.pager-actions {
  display: flex;
  gap: 8px;
}

/* Os detalhes de uma ficha: etiqueta e valor */
.details {
  display: grid;
  gap: 0;
}
.details > div {
  display: grid;
  grid-template-columns: minmax(120px, 34%) minmax(0, 1fr);
  gap: 12px;
  padding: 9px 0;
  border-top: 1px solid var(--track);
}
.details > div:first-child {
  border-top: 0;
  padding-top: 0;
}
.details dt {
  color: var(--text-muted);
}
.details dd {
  min-width: 0;
  overflow-wrap: anywhere;
}
@media (max-width: 479.98px) {
  .details > div {
    grid-template-columns: minmax(0, 1fr);
    gap: 2px;
  }
}

/* Os alimentos de uma pessoa, em etiquetas */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 3px 10px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg);
  font-size: 13px;
}

/* Listas curtas com link (as receitas guardadas de uma pessoa) */
.short-list li + li {
  border-top: 1px solid var(--track);
}
.short-list a {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 8px 18px;
}
.short-list a:hover {
  background: #fdfbf7;
}
.short-list a:hover .short-title {
  text-decoration: underline;
}
.short-list a > .icon {
  margin-left: auto;
  color: var(--text-muted);
}
.short-main {
  display: grid;
  min-width: 0;
  line-height: 1.35;
}
.short-title {
  font-weight: 600;
  overflow-wrap: anywhere;
}
.short-sub {
  color: var(--text-muted);
  font-size: 12.5px;
}

/* As ações de uma ficha e a confirmação do apagar */
.action {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
}
.action-hint {
  color: var(--text-muted);
  font-size: 13px;
}
.confirm {
  max-width: 680px;
  padding: 20px;
  border-color: #efc2bd;
}
.confirm > * + * {
  margin-top: 12px;
}
.confirm-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--danger);
  font-size: 17px;
  font-weight: 700;
}
.confirm form {
  display: grid;
  gap: 8px;
  margin-top: 18px;
}
.confirm label {
  font-weight: 600;
}
.confirm input[type="text"] {
  min-height: 44px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
}
.confirm input[type="text"]:focus {
  border-color: var(--primary);
}
.confirm input[aria-invalid="true"] {
  border-color: var(--danger);
}
.field-error {
  color: var(--danger);
  font-weight: 600;
}
.action-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}

/* Os passos de uma receita */
.steps {
  display: grid;
  gap: 10px;
  padding-left: 0;
  counter-reset: step;
}
.steps li {
  position: relative;
  max-width: 76ch;
  padding-left: 36px;
  counter-increment: step;
}
.steps li::before {
  content: counter(step);
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary-soft);
  color: var(--primary);
  font-size: 12.5px;
  font-weight: 700;
}

/* Uma lista sem nada */
.empty {
  display: grid;
  justify-items: center;
  gap: 4px;
  padding: 36px 18px;
  text-align: center;
}
.empty-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  margin-bottom: 6px;
  border-radius: 12px;
  background: var(--primary-soft);
  color: var(--primary);
}
.empty-title {
  font-weight: 650;
}
.empty-text {
  color: var(--text-muted);
}

/* O rodapé com o que o backoffice mostra e não mostra */
.foot {
  margin-top: 36px;
  padding-top: 14px;
  border-top: 1px solid var(--border);
  color: var(--text-muted);
  font-size: 13px;
}
.foot p {
  max-width: 90ch;
  padding-top: 4px;
}

/* As páginas só com uma mensagem (sem acesso, não encontrada, erro) */
.message {
  max-width: 520px;
  margin: 18vh auto 0;
  padding: 0 16px;
  text-align: center;
}
.message h1 {
  margin-bottom: 8px;
}
.message p {
  color: var(--text-muted);
}
`;
