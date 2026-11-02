# Protein Plate

**Protein without the diet.** Uma web app que mostra que atingir a meta diária de proteína é fácil com comida de verdade: calculas a meta, vês um dia completo que já lá chega, ajustas porções reais e geras receitas por IA com os alimentos escolhidos. Sem dieta, sem contar calorias.

> Projeto de portefólio em construção. A especificação está em [`docs/especificacao.md`](docs/especificacao.md) e a ordem de construção em [`docs/sessoes.md`](docs/sessoes.md).

## Stack

- **Next.js 16** (App Router, TypeScript strict) em **Cloudflare Workers** com `@opennextjs/cloudflare`
- **Cloudflare D1** (UE) + **Drizzle ORM**
- **Better Auth** (Google e Apple), **AI SDK 6** + Anthropic
- **Tailwind v4**, Radix, Lucide, `next-intl`
- **Zod 4**, **Vitest** + fast-check, **Playwright**

## Correr localmente

Precisa de Node 24.

```bash
npm ci
cp .dev.vars.example .dev.vars   # e preenche BETTER_AUTH_SECRET e IP_HASH_SECRET
npm run db:migrate:local
npm run db:seed:local
npm run dev                      # http://localhost:3000
```

`npm run preview` faz o build do OpenNext e corre o Worker como em produção (http://localhost:8787). A IA fica simulada (`AI_MODE=mock`) em local.

## Qualidade

```bash
npm run lint && npm run typecheck && npm test
npm run content:check -- --allow-todo
npm run test:e2e
```

## Arquitetura

```text
src/domain/      regras puras (meta, refeições, proteína, dia exemplo, fechar a meta) — 100% testadas
src/server/      D1, Better Auth, IA, serviços (server-only)
src/features/    UI por funcionalidade
content/foods/   fonte única dos alimentos → seed da D1 + módulo tipado
worker/          Worker próprio: valida o env e corre o cron de limpeza
```

A proteína é sempre calculada pela app a partir de `content/foods` (valores da TCA do INSA), nunca pela IA. O peso nunca sai do browser.
