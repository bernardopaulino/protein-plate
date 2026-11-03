# Protein Plate

**Protein without the diet.** Uma web app que mostra que atingir a meta diária de proteína é fácil com comida de verdade: entras com o Google ou a Apple, respondes a um formulário de dois minutos (meta, refeições e treino, o que não comes, o que gostas, a tua cozinha), vês um dia completo com os teus alimentos que já chega à meta e geras receitas por IA feitas para ti. Sem dieta, sem contar calorias.

> Projeto de portefólio. A especificação está em [`docs/especificacao.md`](docs/especificacao.md) e a ordem de construção em [`docs/sessoes.md`](docs/sessoes.md).

## O que já faz

- **Login obrigatório** (`/entrar`, Google ou Apple) e **formulário de boas-vindas** (`/comecar`) em 6 passos com motion e ilustrações: meta (peso × intensidade), refeições com pré e pós-treino, dieta e alergias, alimentos de que gostas, tempo e equipamento de cozinha. O peso e as alergias só se guardam com consentimento explícito.
- **Dia exemplo personalizado e determinístico** (`/o-meu-dia`): só com o que podes comer e os teus favoritos primeiro; para todas as metas de 80 a 250 g e todas as 57 combinações de refeições, o total fica entre 100% e 110% (testes property-based, também com dietas e alergias aleatórias).
- **Ajustar o dia**: stepper de meia porção, painel inferior para adicionar alimentos, "Faltam 23 g" em região `aria-live` e 3 sugestões de um toque para fechar a meta.
- **Catálogo** (`/alimentos`): páginas estáticas geradas do JSON, filtros por refeição, facilidade e categoria ("snack sem preparação com mais proteína" em 2 toques).
- **Receitas por IA** (`POST /api/recipes`): só campos fechados; a meta da refeição, o treino, o equipamento e a dieta vêm do perfil; os alimentos com alergénios nunca chegam ao modelo; rate limiting; quotas diárias por conta (HMAC diário); cache por `cache_key`; schema do modelo construído por pedido; validação depois do modelo com uma nova tentativa; **a proteína é sempre calculada pela app**.
- **Conta** (Google e Apple, Better Auth): consentimento versionado, "As minhas preferências", sincronização do dia, exportar dados (JSON) e apagar conta com login recente.
- **Backoffice** (`admin/`, Cloudflare Access): painel, utilizadores, receitas e alimentos, sem dados de saúde por pessoa.
- **Base**: CSP e cabeçalhos de segurança, cron de limpeza horário, PWA, páginas legais, PT (estrutura EN pronta).

## Stack

- **Next.js 16** (App Router, TypeScript strict) em **Cloudflare Workers** com `@opennextjs/cloudflare`
- **Cloudflare D1** (UE) + **Drizzle ORM**, rate limiting da Cloudflare
- **Better Auth 1.7**, **AI SDK 6** + Anthropic (`claude-haiku-5-5`)
- **Tailwind v4**, Radix, vaul, Lucide, **motion**, ilustrações Fluent Emoji 3D, `next-intl`
- **Zod 4**, **Vitest** + fast-check, **Playwright** + axe-core, Lighthouse CI

## Arquitetura

```text
src/domain/      regras puras (meta, refeições, proteína, dia exemplo, fechar a meta, contratos Zod)
src/server/      D1, Better Auth, IA, serviços e Server Actions (server-only, db injetado)
src/features/    UI por funcionalidade (onboarding, catalog, day, recipes, account, landing)
src/components/  ProteinNumber, GoalProgress, MealSection, PortionStepper, FoodCard, chips…
content/foods/   fonte única dos alimentos → seed da D1 + módulo tipado
worker/          Worker próprio: valida o env (não arranca sem segredos), HSTS, cache das receitas, cron
admin/           backoffice (Worker próprio, Cloudflare Access, HTML sem JavaScript)
```

Decisões que vale a pena conhecer:

- **Português sem prefixo, sem middleware.** O proxy do Next 16 corre em Node, que no Workers é experimental; as rotas são reescritas para `/pt/...` no `next.config.ts`.
- **Login obrigatório, dia instantâneo.** As páginas da app exigem sessão e o formulário concluído (`src/server/auth/guard.ts`). O dia vive só na D1: o ecrã muda logo e cada mudança grava-se por Server Action (debounce, um pedido de cada vez, sempre o dia mais recente); o servidor volta a filtrar tudo pelas refeições e restrições da pessoa.
- **Receitas imutáveis e sem dono**, com cache pública longa acrescentada pelo Worker (só no HTML).
- **Dados de saúde só com consentimento**: o peso e as alergias guardam-se só com consentimento explícito, nunca vão para a IA nem aparecem por pessoa no backoffice.
- **Sem PII nos registos**: quotas por HMAC com chave diária; sessões sem IP nem user agent; tokens OAuth descartados (exceto o refresh token da Apple, cifrado, para a revogar ao apagar a conta).

## Correr localmente

Precisa de Node 24.

```bash
npm ci
cp .dev.vars.example .dev.vars   # preenche BETTER_AUTH_SECRET e IP_HASH_SECRET (32+ caracteres)
npm run db:migrate:local
npm run db:seed:local
npm run dev                      # http://localhost:3000 (IA simulada)
npx tsx --env-file=.dev.vars scripts/dev-session.ts   # sessão de teste local (cookie pp.session_token)
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
- **Contas e segredos**: Google e Apple a funcionar em staging; receitas com o modelo real em staging (`eval:recipes`: 20/20 válidas, mediana 6,9 s, menos de 0,001 $ por receita). Staging em `https://staging.protein-plate.app`, produção em `https://protein-plate.app`.
- **Performance** (Lighthouse mobile contra staging, mediana de 3 corridas, 2026-11-03): performance 90–91 em `/`, `/comecar`, `/alimentos` e no detalhe dos alimentos, 89 em `/o-meu-dia` (medido antes de o dia passar a vir do servidor); acessibilidade e boas práticas 100; SEO 100 nas páginas indexáveis. O limite é o LCP (cerca de 3,5 s em 4G lento simulado).
