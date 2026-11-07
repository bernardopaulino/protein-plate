---
version: 1
slug: "src-app-locale-site-page-tsx"
primary_target: "src/app/[locale]/(site)/page.tsx"
related_targets:
  [
    "src/app/[locale]/(app)/alimentos/page.tsx",
    "src/app/[locale]/(app)/alimentos/[id]/page.tsx",
    "src/app/[locale]/(app)/entrar/page.tsx",
    "src/features/day/day-view.tsx",
  ]
---

# Página inicial e sistema do redesign (Roda dos Alimentos)

## Scope

Página inicial (Persuade), que fixa o sistema visual do redesign completo: páginas públicas (alimentos, detalhe, entrar, legais) com o mesmo mundo e a app (Hoje, receitas, formulário, conta) em modo Operate, com o mesmo sistema mais contido. Ficam: nome e frase, logótipo do anel, cores e letra atuais, tom zero culpa. Velocidade primeiro: Lighthouse ≥ 90 em mobile; o three só no desktop depois do LCP.

Audiência: quem treina ou quer comer mais proteína sem dieta; recrutadores que só veem as páginas públicas. Ação: "Começar agora" (login e formulário). Prova: o dia exemplo real de 160 g, alimentos e gramas reais, o prato 3D.

## Direction contract

THESIS: O dia é uma roda que se completa: cada refeição é um setor da Roda dos Alimentos que todos aprendemos na escola, e a meta é a roda cheia. Recusa o hero dividido com telemóvel e a fila de cartões de funcionalidades.

OWN-WORLD: Fundo creme do logótipo; setores planos em verdes e amarelos do anel, separados por raios grossos da cor do fundo; legendas curvas ao longo do aro em Bricolage; comida dentro dos setores; o número de proteína gigante no cubo da roda. Fatias (setores) como marca de refeição em toda a app; pílulas, listas sem caixas, uma só borda fina.

STORY: Percebe que um dia normal de comida de verdade enche a roda até à meta; acredita porque os setores mostram alimentos e gramas reais; carrega em "Começar agora".

FIRST VIEWPORT: À esquerda, "Proteína sem dieta." enorme, o lead, "Começar agora" e "Ver os alimentos". À direita, a roda inclinada em 3D, maior do que a coluna e cortada pela margem, com as quatro refeições do dia exemplo nos setores e "171 g de 160 g" no cubo. Telemóvel: a mesma roda em CSS 3D por baixo do título.

FORM: A Roda dos Alimentos, posição 1 de 7 na lista ordenada (o cartão IMPECCABLE’S PICK, escolhido pelo utilizador). Interação assinatura: o scroll faz girar a roda e traz cada setor para a frente; gramática de movimento: rotação em torno de um centro, varrimento dos setores, números que contam. seed:5ae33cf2a0d92fea

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
