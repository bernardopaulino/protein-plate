---
name: Protein Plate
description: Proteína sem dieta. / Protein without the diet.
colors:
  primary: "#2f6b3a"
  on-primary: "#ffffff"
  primary-soft: "#e3efe2"
  accent: "#f2b33d"
  ink-on-accent: "#1f1b16"
  bg: "#fbf8f3"
  surface: "#ffffff"
  text: "#1f1b16"
  text-muted: "#6b6258"
  track: "#eae3d8"
  border: "#e3d9cb"
  danger: "#b3261e"
  meal-pequeno-almoco: "#f2b33d"
  meal-meio-da-manha: "#f6d48c"
  meal-almoco: "#2f6b3a"
  meal-lanche: "#8fbf91"
  meal-jantar: "#1e4a27"
  meal-ceia: "#d6c9b4"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(3.25rem, 1.6rem + 5.2vw, 6rem)"
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 800
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  number:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
    fontFeature: "tnum"
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  body-lead:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.43
rounded:
  pill: "9999px"
  field: "1rem"
  card: "1.25rem"
  panel: "1.75rem"
  band: "2.5rem"
spacing:
  gutter-sm: "16px"
  gutter-md: "24px"
  gutter-lg: "32px"
  row: "12px"
  section: "96px"
  section-lg: "128px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-primary-lg:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.pill}"
    padding: "0 28px"
    height: "52px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  button-secondary-hover:
    backgroundColor: "{colors.primary-soft}"
  button-soft:
    backgroundColor: "{colors.primary-soft}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "0 20px"
    height: "44px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  badge-accent:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink-on-accent}"
    rounded: "{rounded.pill}"
    padding: "2px 10px"
  goal-progress:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "20px"
  progress-track:
    backgroundColor: "{colors.track}"
    rounded: "{rounded.pill}"
    height: "22px"
  progress-track-reached:
    backgroundColor: "{colors.accent}"
  search-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    height: "52px"
  closing-band:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.band}"
    padding: "80px 48px"
---

# Design System: Protein Plate

## Overview

**Creative North Star: "A Roda dos Alimentos"**

O dia é uma roda que se completa. Cada refeição é um setor da Roda dos Alimentos que se aprende na escola, pela ordem do dia a começar no topo; a meta de proteína é o aro cheio; o anel do logótipo (verde com um quarto amarelo) já é essa roda. Tudo o resto deriva daí: a cor de cada refeição é uma fatia, a barra de progresso é a roda desenrolada, a navegação e os passos marcam-se com uma fatia pequena acesa.

O mundo é "cozinha, não ginásio": fundo creme quente, verdes e amarelos tirados do anel, comida ilustrada em 3D dentro dos setores e um número de proteína gigante e tabular como assinatura. A densidade é calma: listas com filetes em vez de caixas, uma só borda fina, pílulas para tudo o que se carrega. As páginas públicas (início, alimentos, detalhe, entrar) mostram o mundo em grande, com a roda inclinada a sangrar pela borda do ecrã; a app (O meu dia, receitas, formulário, conta) usa o mesmo sistema mais contido, em modo de trabalho.

O movimento tem uma só gramática: rotação em torno de um centro, varrimento dos setores e do aro, números que contam, sempre com a mesma curva. O HTML é a fonte de verdade; a roda, o prato 3D e o movimento ilustram e são decorativos. Rejeitado: o hero dividido com um telemóvel e a fila de cartões de funcionalidades.

**Key Characteristics:**
- O dia como roda: uma fatia por refeição, a meta como aro.
- Número de proteína enorme em Bricolage Grotesque, tabular, com o "g" a 55 % e em tom apagado.
- Fundo creme, verdes e amarelos do anel; o amarelo só como fundo.
- Listas com filetes, pílulas, uma só borda fina; painéis só onde a informação flutua.
- Zero culpa visual: nunca vermelho ligado à nutrição.

## Colors

Uma paleta quente e terrosa tirada do logótipo: creme, verde-folha, amarelo-gema, e uma escala de fatias que vai do amarelo ao verde-escuro. Os valores do frontmatter são os do modo claro; o modo escuro (segue o sistema, com as classes `.dark`/`.light` a forçar) está no sidecar.

### Primary
- **Verde do Anel** (primary): ações principais, o aro da meta a encher, o total atingido, o foco do teclado, `caret-color` e `accent-color`. No escuro passa a um verde claro e o texto por cima passa a creme-escuro (on-primary).
- **Verde Broto** (primary-soft): fundo dos botões suaves, hover do secundário, avisos ("Para fechar a meta", ideias no detalhe), o chip de grupo selecionado.

### Secondary
- **Amarelo Gema** (accent): só fundo. A pílula "Meta atingida", a moldura da barra e a faixa do aro quando a meta chega, a etiqueta pós-treino, a seleção de texto. O texto por cima é sempre a tinta fixa (ink-on-accent), nos dois modos.

### Tertiary: as Fatias
- **Fatias de refeição** (meal-pequeno-almoco, meal-meio-da-manha, meal-almoco, meal-lanche, meal-jantar, meal-ceia): uma cor por refeição, derivada do verde e do amarelo do anel. Pintam os setores da Roda, os segmentos do `GoalProgress`, as fatias do prato 3D e os `MealGlyph`.
- **Fatias de grupo** (`--group-protein/carb/fruit/vegetable/nuts`): as mesmas cores por outra ordem, para as secções do catálogo e os `SectionGlyph`.

### Neutral
- **Creme do Logótipo** (bg): o fundo de tudo; também os raios do `SectorGlyph` e o fundo redondo das ilustrações nas listas.
- **Prato** (surface): painéis, botão secundário, chips por selecionar, o cubo da roda, os raios entre setores da roda grande.
- **Tinta Quente** (text): texto e o filete grosso de 2 px por cima das refeições e das receitas.
- **Tinta Apagada** (text-muted): porções, unidades "g", legendas, navegação inativa.
- **Massa** (track): o aro e a barra por encher, a fatia apagada dos glyphs, a scrollbar.
- **Filete** (border): a borda fina única de listas, chips, campos e painéis.
- **Erro Técnico** (danger): só erros técnicos (rede, formulário inválido), nunca nutrição.

### Named Rules
**The Só Fundo Rule.** O amarelo (accent) e todas as fatias (`--meal-*`, `--group-*`) são só fundo: nunca cor de texto, nunca texto em cima de uma fatia. Texto sobre o amarelo usa a tinta fixa.

**The Zero Culpa Rule.** Nada ligado à nutrição fica vermelho. Abaixo da meta é "Faltam X g" em tinta normal; ao chegar, verde e uma moldura amarela. `danger` existe só para erros técnicos.

**The Uma Fatia, Uma Refeição Rule.** A cor de uma refeição é a mesma na roda, na barra, no prato 3D e no glyph. Não se inventa cor nova para uma refeição ou grupo.

## Typography

**Display Font:** Bricolage Grotesque (com ui-sans-serif, system-ui)
**Body Font:** Figtree (com ui-sans-serif, system-ui)

**Character:** Bricolage dá peso e um toque irregular, de mesa de cozinha, aos títulos e números; Figtree é limpa e redonda para ler porções e textos curtos. `h1`–`h3` levam tracking −0,02em e `text-wrap: balance`; parágrafos `pretty`.

### Hierarchy
- **Display** (800, `--text-display` até 6rem, 0,92): o título da página inicial ("Proteína sem dieta.", máx. 11ch) e o total do dia exemplo. Em telemóvel o título fica a 3,25rem.
- **Headline** (800, 2rem a 2,75rem a partir de lg): títulos de secção na página inicial e nas páginas públicas; a faixa de fecho chega a 3,5rem.
- **Title** (700, 1,25–1,5rem): nomes de refeição, títulos de passos, títulos de receitas, títulos de página na app.
- **Number** (`ProteinNumber`, Bricolage 700, tabular): sm 1rem, md 1,25rem, lg 1,5rem, xl 2,75rem, hero 3,5rem; no cubo e no total cresce em clamp até 5,25rem e 800. O "g" a 0,55em, 600, em text-muted.
- **Body** (400, 1rem/1,5): texto corrido, máx. `max-w-prose`. **Body-lead** (1,125–1,25rem, text-muted): o lead do hero e as legendas de secção.
- **Label** (600, 0,875rem): botões pequenos, chips, porções, navegação. Sem maiúsculas nem tracking largo.

Escala base: 12 / 14 / 16 / 20 / 24 / 32 / 56 px, mais o display fluido.

### Named Rules
**The Número É a Assinatura Rule.** A proteína aparece sempre pelo `ProteinNumber`: Bricolage, bold, tabular, unidade mais pequena e apagada. Números em inputs também tabulares.

**The Sem Eyebrows Rule.** Nenhum título leva um rótulo pequeno em maiúsculas por cima. A refeição de uma receita identifica-se com a sua fatia e o nome por baixo do título.

## Layout

A app ocupa o ecrã até 80rem (90rem a partir de 1536 px), com margens de 16 / 24 / 32 px; cabeçalho, conteúdo e rodapé partilham o mesmo contentor. Cabeçalho fixo de 64 px em `bg` com um filete por baixo.

- **Telemóvel:** uma coluna; barra de navegação em baixo (56 px por alvo, `surface` a 95 % com blur, safe-area).
- **Página inicial (lg+):** duas colunas, texto à esquerda e a roda fixa à direita a 118 % da coluna, a sangrar pela borda do ecrã (o `body` corta só o lado). Cada refeição da história ocupa ~72svh para o scroll a trazer à frente. Secções separadas por 96 px (128 px em lg). Passos em grelha 1 : 1,4 com o título fixo.
- **O meu dia (desktop):** refeições à esquerda (duas colunas a partir de 1280 px), coluna fixa à direita com o `GoalProgress`, o prato e "Para fechar a meta".
- **Catálogo e receitas guardadas:** até 4 colunas. **Detalhe:** "Adicionar ao meu dia" ao lado.
- **Formulário de boas-vindas e textos legais:** uma coluna centrada.
- Ritmo das listas: linhas de 12 px de padding vertical, mínimo 64 px de altura; 44 px de alvo mínimo em tudo. Sem scroll horizontal de 320 a 2560 px.

## Elevation & Depth

Plano por defeito: a profundidade vem do creme por baixo do `surface` branco e do filete, não de sombras. As poucas sombras são difusas, quentes (castanho `#1f1b16` a 45–55 %) e com espalhamento negativo, para assentar objetos e não para separar caixas. A única profundidade real é a da Roda: inclinada em CSS 3D (perspetiva 1400 px) com uma sombra de chão, e o prato 3D por cima dela no desktop.

### Shadow Vocabulary
- **Pousado** (`box-shadow: 0 8px 18px -10px rgb(31 27 22 / 0.55)`, hover `0 12px 22px -10px`): o botão primário, que sobe 1 px no hover.
- **Cubo** (`box-shadow: 0 18px 36px -16px rgb(31 27 22 / 0.5)`): o cubo elíptico com o número no centro da roda (e a versão menor no prato do dia).
- **Sombra da Roda** (`filter: drop-shadow(0 26px 28px rgb(31 27 22 / 0.16))`; escuro `0 26px 30px rgb(0 0 0 / 0.55)`): a roda inclinada; a camada só de legendas não leva sombra.
- **Cartão de entrada** (`box-shadow: 0 24px 44px -26px rgb(31 27 22 / 0.45)`): o único cartão flutuante, o de "Entrar".

### Named Rules
**The Sombra Assenta Rule.** Uma sombra só existe para pousar um objeto (botão, cubo, roda, cartão de entrada). Listas, painéis e chips são planos, com filete.

## Shapes

Círculos e pílulas, porque tudo vem de uma roda. Botões, chips, campos de pesquisa, steppers, badges e a barra de progresso são pílulas (9999px). Os contentores que restam têm cantos generosos: cartões e blocos recolhíveis a `card`, o `GoalProgress` a `panel`, o cartão de entrada a 2rem, a faixa verde de fecho a `band`; campos de seleção e avisos a `field`. Ilustrações de alimentos dentro de discos `bg`. O foco é um contorno de 3 px `primary` com 2 px de afastamento e cantos de 0,5rem.

O setor (a fatia) é a forma assinatura: raios grossos da cor do fundo entre setores (5 px na roda grande, 1,6 px no glyph), aro de 9 px com ponta redonda, cubo vazio no centro.

## Components

### Buttons
Pílulas firmes, verde cheio para o próximo passo.
- **Shape:** pílula (`rounded.pill`), alvo mínimo 44 px (lg 52 px), ícone de 20 px.
- **Primary:** `primary` com `on-primary`, sombra Pousado; hover sobe 1 px e clareia (brightness 110 %); active encolhe a 98 %. É sempre "Começar agora" com seta à direita nas páginas públicas.
- **Secondary:** `surface` com filete; hover borda verde a 40 % e fundo `primary-soft`.
- **Soft:** `primary-soft` ("Adicionar alimento"). **Ghost:** só texto, hover `primary-soft`. **Link:** verde sublinhado com offset.
- **Na faixa de fecho:** botão invertido, `bg` com `text`.

### Chips
- **Style:** pílula de 44 px, `surface`, filete `border`, label 600.
- **State:** selecionado passa a `primary` cheio com `on-primary`; hover da borda a verde 60 %. Os grupos do catálogo são pílulas com a ilustração num disco `bg` e o `SectionGlyph`.
- **Badge amarela:** `accent` com a tinta fixa, para "Meta atingida." e "Pós-treino".

### Cards / Containers
- **Regra:** listas com filetes em vez de caixas. Linhas de alimento com `border-top` fino, ilustração num disco `bg` de 48 px, nome 600, porção em muted e o `ProteinNumber` lg à direita; hover passa o filete a verde e a seta avança 2 px.
- **Refeições e receitas:** filete grosso de 2 px em `text` por cima, que passa a `primary` no hover.
- **Painéis (só onde a informação flutua):** `GoalProgress`, "Para fechar a meta" (`primary-soft`), blocos recolhíveis. Fundo `surface`, filete, sem sombra.

### Inputs / Fields
- **Pesquisa:** pílula de 52 px em `surface` com filete, ícone à esquerda e botão de limpar próprio (o do browser está escondido); foco passa a borda a `primary` e mostra o contorno global.
- **Seleção:** caixa `field` de 48 px em `bg` com filete. Números sempre tabulares.
- **Stepper de porção:** pílula com "−", o número (meias porções "1,5") e "+".

### Navigation
- **Desktop:** links pílula de 44 px em Figtree 600, `text-muted` e `text` quando ativos. As quatro secções são as quatro fatias de uma roda: a ativa mostra o seu `SectorGlyph` aceso (16 px); no hover aparece.
- **Telemóvel:** barra inferior fixa com ícones Lucide; o ativo fica em `primary` e com traço mais grosso.
- **Cabeçalho:** logótipo do anel (32 px) com "Protein Plate" em Bricolage, seletor de língua em pílula.

### A Roda (signature)
SVG renderizado no servidor e decorativo (`aria-hidden`): setores em cor cheia com até 3 ilustrações de alimentos, legendas curvas no aro em Bricolage 700 (sempre a ler-se da esquerda para a direita), aro da meta que enche em `primary` e ganha a faixa `accent` ao chegar, cubo em HTML por cima. Inclina-se em CSS 3D, gira as fatias 850 ms (os alimentos ficam de pé) e esbate as fatias fora de foco a 26 %. No desktop da página inicial, o prato 3D (Kenney) substitui-a por cruzamento de opacidade e fica só a camada das legendas por cima.

### SectorGlyph / MealGlyph / SectionGlyph
A fatia pequena (28 px por defeito): `parts` setores iguais, os acesos na cor da refeição ou do grupo, os outros em `track`, raios em `bg`. Marca refeições, grupos, passos (acesos cumulativamente: 1, 2, 3 de 3) e a secção ativa da navegação.

### GoalProgress
A roda desenrolada: painel `panel` com o `ProteinNumber` xl, "de 160 g" e a mensagem em `aria-live`. Barra de 16 px dentro de uma moldura de 3 px (`track`, ou `accent` ao chegar), um segmento por refeição na cor da sua fatia, separados por 3 px de `surface`. Pode ficar fixa por baixo do cabeçalho.

### Motion
Uma curva para tudo: `--ease-out` (`cubic-bezier(0.2, 0.8, 0.2, 1)`). Roda 850–900 ms, esbater 450 ms, aro 900 ms (250 ms no prato e na barra), estados de botão e lista 150–200 ms. Na página inicial o scroll (IntersectionObserver) comanda a roda, o cubo e o prato. `prefers-reduced-motion` põe todas as transições a 0,01 ms: tudo aparece no sítio. Nada anda sozinho.

## Do's and Don'ts

### Do:
- **Do** pintar cada refeição com a sua `--meal-*` em todo o lado (roda, barra, prato 3D, glyph).
- **Do** mostrar proteína só pelo `ProteinNumber`, tabular, com o "g" a 0,55em em muted.
- **Do** usar listas com filetes (1 px `border`; 2 px `text` por cima de refeições e receitas) em vez de caixas quando a informação é uma sequência.
- **Do** fazer tudo o que se carrega em pílula com pelo menos 44 px.
- **Do** marcar refeições, grupos, passos e a navegação ativa com o `SectorGlyph`.
- **Do** usar o amarelo só como fundo de celebração ("Meta atingida", moldura da barra, faixa do aro), com a tinta fixa por cima.
- **Do** mover só com rotação, varrimento e contagem, na curva `--ease-out`, parando tudo com `prefers-reduced-motion`.
- **Do** manter a roda e o 3D decorativos: o HTML ao lado diz sempre o mesmo.

### Don't:
- **Don't** usar vermelho, `danger` ou "falhaste" ligados à nutrição; abaixo da meta é "Faltam X g".
- **Don't** pôr texto sobre uma fatia nem usar `accent` ou `--meal-*` como cor de texto.
- **Don't** pôr eyebrows ou rótulos em maiúsculas com tracking largo por cima de títulos.
- **Don't** pôr sombras em listas, chips ou painéis; a sombra só pousa botão, cubo, roda e o cartão de entrada.
- **Don't** fazer o hero dividido com um telemóvel nem a fila de cartões de funcionalidades.
- **Don't** inventar cores fora da paleta do anel nem fontes além de Bricolage Grotesque e Figtree.
