# Protein Plate

**Protein without the diet.** Uma web app que mostra que atingir a meta diária de proteína é fácil com comida de verdade: calculas a meta, vês um dia completo que já lá chega, ajustas porções reais e geras receitas por IA com os alimentos escolhidos. Sem dieta, sem contar calorias, sem conta obrigatória.

> Projeto de portefólio. A especificação está em [`docs/especificacao.md`](docs/especificacao.md) e a ordem de construção em [`docs/sessoes.md`](docs/sessoes.md).

## O que já faz

- **Meta em menos de 45 s** (`/comecar`): peso × intensidade arredondado a 5 g, 2 a 6 refeições com combinação pré-selecionada e refeição pós-treino opcional. O peso fica só no browser.
- **Dia exemplo determinístico** (`/o-meu-dia`): para todas as metas de 80 a 250 g e todas as 57 combinações de refeições, o total fica entre 100% e 110% (teste property-based).
- **Ajustar o dia**: stepper de meia porção, painel inferior para adicionar alimentos, "Faltam 23 g" em região `aria-live` e 3 sugestões de um toque para fechar a meta.
- **Catálogo** (`/alimentos`): páginas estáticas geradas do JSON, filtros por refeição, facilidade e categoria ("snack sem preparação com mais proteína" em 2 toques).
- **Receitas por IA** (`POST /api/recipes`): só campos fechados; Turnstile para convidados; rate limiting; quotas diárias com HMAC diário do IP; cache por `cache_key`; schema do modelo construído por pedido; validação depois do modelo com uma nova tentativa; **a proteína é sempre calculada pela app**.
- **Conta opcional** (Google e Apple, Better Auth): consentimento versionado, importação idempotente do estado de convidado, sincronização do dia, exportar dados (JSON) e apagar conta com login recente.
- **Base**: CSP e cabeçalhos de segurança, cron de limpeza horário, PWA, páginas legais, PT (estrutura EN pronta).

## Stack

- **Next.js 16** (App Router, TypeScript strict) em **Cloudflare Workers** com `@opennextjs/cloudflare`
- **Cloudflare D1** (UE) + **Drizzle ORM**, rate limiting e Turnstile da Cloudflare
- **Better Auth 1.7**, **AI SDK 6** + Anthropic (`claude-haiku-5-5`)
- **Tailwind v4**, Radix, vaul, Lucide, `next-intl`
- **Zod 4**, **Vitest** + fast-check, **Playwright** + axe-core, Lighthouse CI

## Arquitetura

```text
src/domain/      regras puras (meta, refeições, proteína, dia exemplo, fechar a meta, contratos Zod)
src/server/      D1, Better Auth, IA, serviços e Server Actions (server-only, db injetado)
src/features/    UI por funcionalidade (goal, catalog, day, recipes, account)
src/components/  ProteinNumber, GoalProgress, MealSection, PortionStepper, FoodCard, chips…
content/foods/   fonte única dos alimentos → seed da D1 + módulo tipado
worker/          Worker próprio: valida o env (não arranca sem segredos), HSTS, cache das receitas, cron
```

Decisões que vale a pena conhecer:

- **Português sem prefixo, sem middleware.** O proxy do Next 16 corre em Node, que no Workers é experimental; as rotas são reescritas para `/pt/...` no `next.config.ts`.
- **O dia vive no browser.** Convidado: `localStorage` versionado e validado com Zod. Com conta: a mesma cópia local (com `owner`) sincroniza com a D1 por Server Action; o servidor recusa se `owner` não for o utilizador da sessão.
- **Receitas imutáveis e sem dono**, com cache pública longa acrescentada pelo Worker (só no HTML).
- **Sem PII nos registos**: quotas por HMAC com chave diária; sessões sem IP nem user agent; tokens OAuth descartados (exceto o refresh token da Apple, cifrado, para a revogar ao apagar a conta).

## Correr localmente

Precisa de Node 24.

```bash
npm ci
cp .dev.vars.example .dev.vars   # preenche BETTER_AUTH_SECRET e IP_HASH_SECRET (32+ caracteres)
npm run db:migrate:local
npm run db:seed:local
npm run dev                      # http://localhost:3000 (IA simulada)
npm run preview                  # build OpenNext + Worker local, igual a produção (:8787)
```

## Qualidade

```bash
npm run lint && npm run typecheck && npm test   # unitários (100% de src/domain) + integração na D1 local
npm run content:check -- --allow-todo
npm run test:e2e                                 # Playwright: primeira utilização, ajustar o dia, receita, axe claro/escuro
npm run test:lighthouse                          # com o Worker local a correr
npm run eval:recipes                             # contra o modelo real (ANTHROPIC_API_KEY)
```

## Estado e próximos passos

- **Curadoria**: os 168 alimentos da lista estão no catálogo, mas com valores provisórios (`tcaCode: "TODO"`) até serem confirmados na TCA do INSA. O `content:check` sem `--allow-todo` (usado no deploy de produção) falha até lá.
- **Contas e segredos**: Google e Apple a funcionar em staging; Anthropic e Turnstile real por configurar (`docs/setup.md`). Staging em `https://staging.protein-plate.app`, produção em `https://protein-plate.app`.
- **Performance** (Lighthouse mobile contra staging, mediana de 3 corridas, 2026-11-03): performance 90–91 em `/`, `/comecar`, `/alimentos` e no detalhe dos alimentos, 89 em `/o-meu-dia` (o dia só aparece depois de ler o `localStorage`); acessibilidade e boas práticas 100; SEO 100 nas páginas indexáveis. O limite é o LCP (cerca de 3,5 s em 4G lento simulado).
