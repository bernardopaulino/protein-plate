# Sessões de Claude Code

Uma sessão por passo da ordem de construção, numa só sequência e com deploy contínuo em staging. Cada prompt está pronto a colar. O Claude Code lê o `CLAUDE.md` automaticamente; os prompts apontam para a secção certa da especificação.

Em todas as sessões, o Claude Code mostra um plano curto, espera confirmação e depois implementa a sessão completa, com testes e commits.

**Em paralelo, desde o primeiro dia (fora do Claude Code):**

- Completar a curadoria dos 168 alimentos com os valores da TCA (ver `docs/alimentos.csv` e a secção 4).
- Email ao INSA (tabela.alimentos@insa.min-saude.pt) a confirmar os termos de reutilização da TCA.
- Contas e segredos de `docs/setup.md`, sobretudo a Apple, que só se testa em staging.

---

## 1. Base técnica

```text
Lê o CLAUDE.md e as secções 8 e 9 de docs/especificacao.md. Cria a base do projeto:
- Next.js 16 para Cloudflare Workers com @opennextjs/cloudflare (npm create cloudflare@latest -- protein-plate --framework=next --platform=workers), TypeScript strict, ESLint (CLI), Prettier, Tailwind v4 e shadcn/ui.
- Estrutura de pastas do CLAUDE.md, com rotas em src/app/[locale] e next-intl (pt sem prefixo).
- Validação de variáveis de ambiente com Zod (src/lib/env.ts); o Worker não arranca sem segredos válidos.
- D1 (bindings DB local, staging e produção) com Drizzle e uma tabela de teste; cliente por pedido via getCloudflareContext().
- Better Auth com Google em localhost, rota /api/auth/[...all] e allowlist de endpoints.
- Route Handler de teste que lê da D1 e chama o modelo simulado (AI_MODE=mock com MockLanguageModelV3).
- Scripts do CLAUDE.md, wrangler.jsonc com ambientes staging e production, CI no GitHub Actions (lint, typecheck, test, build) e deploy em staging.
Confirma primeiro as versões estáveis atuais de cada pacote. O objetivo é staging a responder com D1, sessão e IA simulada antes de qualquer funcionalidade.
```

## 2. Schema completo da D1

```text
Lê a secção 5 de docs/especificacao.md. Implementa o schema Drizzle completo (tabelas de alimentos, Better Auth, profiles, day_plans, plan_items, recipes, recipe_ingredients, saved_recipes, usage_counters) com índices, chaves estrangeiras e cascatas. Gera a primeira migração com drizzle-kit, aplica-a localmente e em staging. Remove a tabela de teste da sessão anterior. Escreve um teste de integração na D1 local que confirma as cascatas ao apagar um utilizador.
```

## 3. Domínio

```text
Lê a secção 3 de docs/especificacao.md. Implementa em src/domain, como funções puras e sem I/O:
- goal.ts (meta, intensidades, arredondamento a 5 g, limites)
- meals.ts (tipos, combinações pré-selecionadas, pesos, pós-treino, meta por refeição)
- protein.ts (proteína por porção, totais exatos, formatação pt-PT)
- example-day.ts (dia exemplo determinístico com seed)
- suggestions.ts (fechar a meta)
- contracts/ com os schemas Zod do estado de convidado, plano, pedido e resposta de receitas.
Testes com Vitest e fast-check, incluindo o teste property-based do dia exemplo para todas as metas de 80 a 250 g e todas as combinações de refeições. Cobertura de 100% em src/domain. Usa alimentos de teste (fixtures) enquanto a curadoria não estiver pronta.
```

## 4. Conteúdo dos alimentos

```text
Lê a secção 4 de docs/especificacao.md e docs/alimentos.csv. Implementa:
- Schema Zod dos alimentos e scripts/content-check.ts (todas as validações da secção 4, incluindo PROCESSING_EXCEPTIONS para a whey).
- scripts/content-build.ts que gera o seed SQL da D1 e um módulo TypeScript tipado, com teste de coerência entre os dois.
- content/foods/<categoria>.json com os 40 alimentos mais usados da lista, com campos completos e valores marcados como TODO onde ainda faltam dados da TCA; o content:check deve falhar enquanto houver TODO em produção, mas aceitar em desenvolvimento com uma flag.
- Scripts content:check, content:build e db:seed:local.
```

## 5. Design base

```text
Lê a secção 11 de docs/especificacao.md. Configura os tokens de cor (claro e escuro) no @theme do Tailwind v4, as fontes Bricolage Grotesque e Figtree com next/font, e cria os componentes ProteinNumber, GoalProgress, MealSection, PortionStepper, FoodCard, SuggestionChip, RecipeCard e FilterChips, com estados de foco, teclado e prefers-reduced-motion. Cria uma página interna /dev/ui (só em desenvolvimento) que mostra todos os componentes em claro e escuro.
```

## 6. Landing e onboarding

```text
Lê as secções 3 (meta e refeições) e 10 (ecrãs 1 e 2) de docs/especificacao.md. Implementa a landing e /comecar: peso, intensidade, número de refeições com combinação pré-selecionada editável, refeição pós-treino opcional e o resultado. Guarda tudo no guest store (src/lib/guest-store.ts, localStorage versionado e validado com Zod, com migração). No fim, "Vê como é fácil" leva a /o-meu-dia com o dia exemplo já gerado. Textos em src/messages/pt.json, com o aviso de saúde da secção 9.
```

## 7. Catálogo e detalhe

```text
Lê as secções 8 e 10 (ecrãs 5 e 6) de docs/especificacao.md. Implementa /alimentos e /alimentos/[id] como páginas estáticas geradas do módulo tipado dos alimentos: pesquisa, filtros em chips (categoria, refeição, facilidade), ordenação, cartões com proteína por porção em destaque, e detalhe com porções, valor por 100 g, ideias, fonte TCA e "Adicionar ao meu dia" (escolhendo a refeição). Metadados para SEO por alimento.
```

## 8. Hoje

```text
Lê as secções 3 e 10 (ecrãs 3 e 4) de docs/especificacao.md. Implementa /o-meu-dia para convidados: barra de progresso fixa, refeições pela ordem do dia com etiqueta pós-treino, itens com stepper de meia porção, remover, painel inferior para adicionar alimentos, painel "Para fechar a meta" com 3 sugestões de um toque, "Outras opções" para o dia exemplo e região aria-live para "Faltam X g". Escreve o teste end-to-end da primeira utilização com Playwright (da landing ao dia completo em menos de 2 minutos).
```

## 9. Receitas por IA

```text
Lê a secção 6 de docs/especificacao.md. Implementa POST /api/recipes com o pipeline completo (Zod, Turnstile para convidados, rate limiting, quotas em usage_counters com HMAC diário do IP, cache por cache_key com variantes, generateText + Output.object com schema construído por pedido, validação depois do modelo com uma nova tentativa, cálculo da proteína pela app, gravação na D1). Prompt versionado em src/server/ai/prompts/recipe.v1.ts. Implementa /receitas/nova (alimentos pré-selecionados da refeição, estados a gerar/erro/quota) e /receitas/[id] (proteína por dose, quanto cobre da meta da refeição, partilhar, gerar outra, aviso IA, cache pública longa, Open Graph). Testes de integração com o modelo simulado e scripts/eval-recipes.ts com 20 combinações fixas.
```

## 10. Contas

```text
Lê a secção 7 de docs/especificacao.md. Completa o Better Auth com Google e Apple na web (client secret ES256 gerado com jose, trustedOrigins da Apple), ecrã "Criar conta" com consentimento versionado, regras de conta (sem ligação implícita, apagar conta com login recente, revogação de tokens da Apple), Server Action importGuestData idempotente com resolução de conflito, leitura e escrita do dia e da meta na D1 para utilizadores com sessão, guardar receitas, exportar dados em JSON e apagar conta. Testes de integração com dois utilizadores em todas as ações. Reutiliza os padrões do rejection-quest-api.
```

## 11. Acabamento

```text
Lê a secção 9 de docs/especificacao.md. Implementa o cron horário num custom worker do OpenNext (limpa sessões expiradas e usage_counters com mais de 2 dias), os cabeçalhos de segurança (CSP, HSTS, etc.), as páginas /privacidade e /termos, o manifest e os ícones da PWA, e a estrutura de inglês em next-intl (sem traduzir ainda). Revê todos os textos da UI pelo tom da secção 10.
```

## 12. Verificação

```text
Lê a secção 12 de docs/especificacao.md. Completa os testes end-to-end (ajustar o dia, gerar receita com o modelo simulado), adiciona axe-core às páginas principais em claro e escuro, configura Lighthouse CI com o mínimo de 90 nas quatro categorias em mobile e corrige o que falhar. Corre eval:recipes contra o modelo real em staging e resume os resultados.
```

## 13. Lançamento

```text
Prepara o lançamento: workflow de deploy de produção manual (workflow_dispatch), migrações de produção, domínio, checklist final (login Google e Apple em produção, apagar conta, importar convidado, modo escuro, VoiceOver, rede lenta). Escreve o README com descrição, GIF da primeira utilização, stack, arquitetura e como correr localmente (no estilo do README do Rejection Quest), e um case study em docs/case-study.md para o portefólio.
```

## 14. Login obrigatório e personalização (3/11/2026)

```text
Feito. Lê as secções 1, 3 ("Preferências"), 5, 6, 7 e 10 de docs/especificacao.md. Login obrigatório (/entrar, guardas de página, sem modo convidado nem Turnstile), formulário de boas-vindas em 6 passos com motion e ilustrações (meta, refeições com pré e pós-treino, restrições, alimentos de que gosta, cozinha, resumo com consentimento de dados de saúde), alergénios nos alimentos, dia exemplo e receitas só com o que a pessoa pode comer (prompt v2), "As minhas preferências" na conta, migração 0002, testes (unitários, D1 local com duas pessoas, e2e com sessão de teste).
```

## 15. Backoffice

```text
Lê a secção 13 de docs/especificacao.md e docs/backoffice.md. Worker admin/ com Cloudflare Access, painel, utilizadores (sem dados de saúde por pessoa), receitas, alimentos e as ações de terminar sessões e apagar conta, no padrão do backoffice do Rejection Quest.
```

## 16. Feedback do staging: dia na conta, alimentos por grupos, receitas e responsive (3/11/2026)

```text
Feito. O dia passa a viver só na D1 (sem localStorage; saveDayAction com debounce), "Adicionar ao meu dia" grava na conta. Alimentos de que gosta por 5 secções e 25 subgrupos com "Como de tudo" e ilustração por subgrupo (src/domain/food-groups.ts). Receitas com alimentos opcionais: a app completa a base (src/domain/recipe-base.ts); formulário com "Quero usar alimentos que tenho" e "Mais opções". Segurança: Origin e Content-Length em /api/recipes, overrides de glob e tmp. Responsive de 320 a 2560 px (app-container, "Hoje" com coluna lateral fixa).
```
