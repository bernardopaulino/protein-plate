# Protein Plate

**Protein Plate** — "Protein without the diet" — é uma web app (mobile no futuro) que mostra que atingir a meta diária de proteína é fácil com comida de verdade: a pessoa entra (Google ou Apple), responde a um formulário curto (meta, refeições e treino, restrições, alimentos de que gosta, cozinha), vê um dia completo com os seus alimentos que já atinge a meta, ajusta porções reais e gera receitas por IA feitas para ela. Sem dieta, sem contar calorias. Projeto de portefólio do Bernardo (procura de emprego em JS/React/Next.js).

## Documentos do projeto

| Ficheiro | Para quê |
| --- | --- |
| `docs/especificacao.md` | Fonte de verdade: regras de domínio, dados, API, segurança, design. Ler a secção relevante antes de cada tarefa. |
| `docs/sessoes.md` | Ordem de construção e o objetivo de cada sessão. |
| `docs/setup.md` | Contas, segredos e ambientes a configurar. |
| `docs/alimentos.csv` | Lista aprovada de 168 alimentos (nomes, categoria, papel, processamento, porção típica). Os valores nutricionais vêm da TCA do INSA durante a curadoria. |

Quando uma decisão mudar, atualiza `docs/especificacao.md` no mesmo commit.

## Stack

- **Next.js 16** (App Router, TypeScript `strict`) em **Cloudflare Workers** via `@opennextjs/cloudflare` (runtime Node.js, `nodejs_compat`).
- **Cloudflare D1** (jurisdição UE) + **Drizzle ORM** + `drizzle-kit`; migrações aplicadas com Wrangler.
- **Better Auth 1.7**: login só Google e Apple (OAuth web), adaptador Drizzle (SQLite).
- **AI SDK 6** + `@ai-sdk/anthropic`, modelo em `AI_MODEL` (por defeito `claude-haiku-5-5`). Usar `generateText` com `output: Output.object({ schema })`; `generateObject` está descontinuado.
- **Tailwind v4** + **shadcn/ui** (Radix), ícones Lucide, fontes com `next/font` (Bricolage Grotesque + Figtree).
- **next-intl**: português sem prefixo; inglês em `/en` (v1.1). Rotas em `src/app/[locale]` desde o início.
- **Zod 4**, **Vitest** (+ fast-check), **Playwright**, **axe-core**, Lighthouse CI.
- Cloudflare: binding de rate limiting, Turnstile, cron horário (custom worker do OpenNext).

Antes de instalar, confirma as versões estáveis atuais e fixa-as no lockfile.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Next.js em desenvolvimento com bindings locais |
| `npm run preview` | Build OpenNext + Worker local com Wrangler (igual a produção) |
| `npm run lint` / `typecheck` / `test` / `test:e2e` | Qualidade (também no CI) |
| `npm run db:generate` | Gera migração a partir do schema Drizzle |
| `npm run db:migrate:local` / `:staging` / `:production` | Aplica migrações |
| `npm run content:check` | Valida `content/foods/*.json` com Zod |
| `npm run content:build` | Gera seed SQL e módulo TypeScript tipado dos alimentos |
| `npm run db:seed:local` | Carrega o seed na D1 local |
| `npm run eval:recipes` | Avaliações da IA contra o modelo real |
| `npm run cf-typegen` | Tipos dos bindings (`wrangler types`) |
| `npm run deploy:staging` / `deploy:production` | Deploys, sempre com ambiente explícito |

## Estrutura

```text
src/
  app/[locale]/(site)/      landing, privacidade, termos
  app/[locale]/(app)/       entrar, comecar (formulário de boas-vindas), alimentos, o-meu-dia, receitas, conta
  app/api/auth/[...all]/    Better Auth
  app/api/recipes/          geração de receitas (POST)
  domain/                   funções puras + testes, SEM I/O
  domain/contracts/         schemas Zod partilhados
  server/                   import 'server-only': db, auth, ai, services, actions
  features/                 UI por funcionalidade (onboarding, catalog, day, recipes, account, landing)
  components/ui/            shadcn/ui e componentes base
  lib/                      guest-store, format, env
  messages/                 pt.json, en.json
content/foods/              fonte única dos alimentos (JSON)
admin/                      backoffice (Worker próprio, Cloudflare Access)
migrations/  scripts/  tests/  worker/  docs/
```

## Regras que nunca se quebram

1. **A proteína é sempre calculada pela app** a partir de `content/foods`. Nunca vem do modelo de IA.
2. **User ID só da sessão.** Ownership verificada antes de cada escrita. Zod em todas as fronteiras, incluindo Server Actions.
3. **Dados de saúde só com consentimento.** O peso e as alergias só se guardam com consentimento explícito, nunca vão para a IA nem aparecem por pessoa no backoffice.
4. **Cliente Drizzle por pedido**, a partir de `getCloudflareContext().env.DB`; nunca global.
5. **Sem dados pessoais nos logs** (corpos de pedidos, emails, IPs). O IP só existe como HMAC diário, para quotas.
6. **Comida de verdade:** o catálogo não tem ultraprocessados, exceto os ids na lista de exceções (whey).
7. **Copy em português de Portugal**, tratamento por tu, zero culpa: nunca vermelho nem "falhaste" ligados à nutrição.
8. **Acessibilidade WCAG 2.2 AA**; respeitar `prefers-reduced-motion`.
9. **Migrações compatíveis com a versão anterior**; nunca editar uma migração já aplicada.
10. **Segredos só em `.dev.vars` e `wrangler secret`**; o Worker não arranca sem segredos válidos (env validado com Zod).

## Forma de trabalhar

- No início de cada sessão: lê a secção relevante da especificação, mostra um plano curto e espera confirmação. Depois implementa a sessão completa sem parar a cada ficheiro.
- Pergunta quando houver ambiguidade em vez de assumir.
- Código em inglês; textos da UI em `src/messages/pt.json`.
- Commits pequenos com Conventional Commits; `lint`, `typecheck` e `test` verdes antes de cada commit.
- Reutiliza os padrões do Rejection Quest (`rejection-quest-api`): allowlist de endpoints do Better Auth, testes de integração numa D1 local real com dois utilizadores por rota, cron de limpeza, client secret ES256 da Apple, sessões sem IP nem user agent.
