# Protein Plate

> [English](README.md) · No ar em [protein-plate.app](https://protein-plate.app)

**Protein without the diet.** Uma web app que mostra que atingir a meta diária de proteína é fácil com comida de verdade: entras com o Google ou a Apple, respondes a um formulário de dois minutos (meta, refeições e treino, o que não comes, o que gostas, a tua cozinha), vês um dia completo com os teus alimentos que já chega à meta e geras receitas por IA feitas para ti. Sem dieta, sem contar calorias.

> Projeto de portefólio. A especificação está em [`docs/especificacao.md`](docs/especificacao.md) e a ordem de construção em [`docs/sessoes.md`](docs/sessoes.md).

## O que já faz

- **Login obrigatório** (`/entrar`, Google ou Apple) e **formulário de boas-vindas** (`/comecar`) em 6 passos com motion e ilustrações: meta (peso × intensidade), refeições com pré e pós-treino, dieta e alergias, alimentos de que gostas, tempo e equipamento de cozinha. O peso e as alergias só se guardam com consentimento explícito.
- **Dia exemplo personalizado e determinístico** (`/o-meu-dia`): só com o que podes comer e os teus favoritos primeiro; para todas as metas de 80 a 250 g e todas as 57 combinações de refeições, o total fica entre 100% e 110% (testes property-based, também com dietas e alergias aleatórias).
- **Ajustar o dia**: stepper de meia porção, painel inferior para adicionar alimentos, "Faltam 23 g" em região `aria-live` e 3 sugestões de um toque para fechar a meta.
- **Catálogo** (`/alimentos`): páginas estáticas geradas do JSON, filtros por refeição, facilidade e categoria ("snack sem preparação com mais proteína" em 2 toques).
- **Receitas por IA** (`POST /api/recipes`): só campos fechados; a meta da refeição, o treino, o equipamento e a dieta vêm do perfil; os alimentos com alergénios nunca chegam ao modelo; rate limiting; quotas diárias por conta (HMAC diário); cache por `cache_key`, depois a biblioteca de receitas pré-geradas reajustadas às doses, e só depois o modelo, com um schema fixo; validação depois do modelo com uma nova tentativa; **a proteína é sempre calculada pela app**.
- **Conta** (Google e Apple, Better Auth): consentimento versionado, "As minhas preferências", sincronização do dia, exportar dados (JSON) e apagar conta com login recente.
- **Design "Roda dos Alimentos"**: o dia como a roda das escolas, cada refeição uma fatia (as cores do logótipo). A página inicial é uma história em que o scroll gira a roda até à refeição que estás a ler; a barra de progresso é a roda desenrolada, um segmento por refeição; as fatias marcam refeições, grupos de alimentos e passos em toda a app. Sistema registado em `DESIGN.md`.
- **Prato 3D** (three + React Three Fiber, modelos low-poly do Kenney Food Kit): o prato enche até à meta com os alimentos do dia, com o anel na borda a fazer de barra de progresso. Na página inicial (por trás do dia exemplo, só no desktop e depois do LCP), no detalhe de cada alimento ("Ver em 3D", roda com o rato ou as setas) e no "O meu dia". Disposição pura e testada com property-based testing, modelos otimizados com gltf-transform, `frameloop="demand"`, sem 3D sem WebGL ou com poupança de dados, e o chunk do three nunca chega a quem não o vê.
- **Backoffice** (`admin/`, Cloudflare Access): painel, utilizadores, receitas e alimentos, sem dados de saúde por pessoa.
- **Base**: CSP e cabeçalhos de segurança, cron de limpeza horário, PWA, páginas legais, português e inglês (`/en`).

## Stack

- **Next.js 16** (App Router, TypeScript strict) em **Cloudflare Workers** com `@opennextjs/cloudflare`
- **Cloudflare D1** (UE) + **Drizzle ORM**, rate limiting da Cloudflare
- **Better Auth 1.7**, **AI SDK 6** + Anthropic (`claude-haiku-5-5`)
- **Tailwind v4**, Radix, vaul, Lucide, **motion**, ilustrações Fluent Emoji 3D, `next-intl`
- **three** + **@react-three/fiber** (sem drei), modelos Kenney Food Kit (CC0) otimizados com `@gltf-transform/cli`
- **Zod 4**, **Vitest** + fast-check, **Playwright** + axe-core, Lighthouse CI

## Arquitetura

```text
src/domain/      regras puras (meta, refeições, proteína, dia exemplo, fechar a meta, contratos Zod)
src/server/      D1, Better Auth, IA, serviços e Server Actions (server-only, db injetado)
src/features/    UI por funcionalidade (onboarding, catalog, day, recipes, account, landing, plate-3d)
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
npm run lint && npm run typecheck && npm test   # unitários + integração na D1 local
npm run content:check -- --allow-todo
npm run test:e2e                                 # Playwright: primeira utilização, ajustar o dia, receita, axe claro/escuro
npm run test:lighthouse                          # com o Worker local a correr
npm run eval:recipes                             # contra o modelo real (ANTHROPIC_API_KEY)
```

## Estado e próximos passos

- **Curadoria**: os 168 alimentos têm valores de referência revistos (`tcaCode: "REF"`, 5/11/2026). Falta associar o código de cada item na TCA do INSA quando o portal estiver disponível; erros corrigem-se em `content/foods` e no próximo deploy.
- **No ar** desde 5/11/2026 em `https://protein-plate.app` (staging em `https://staging.protein-plate.app`), com login Google e Apple e receitas com o modelo real (`eval:recipes` com o prompt 5: 27/27 válidas à primeira, mediana 2,5 s, p95 3,2 s).
- **Performance** (Lighthouse mobile contra a produção, mediana de 5 corridas, 8/11/2026): performance 90–92 em `/`, `/en`, `/entrar`, `/alimentos` e no detalhe dos alimentos; acessibilidade 100; boas práticas 100; SEO 100 nas páginas indexáveis. TBT 40 ms e CLS 0; o limite é o LCP (cerca de 3,5 s em 4G lento simulado).
