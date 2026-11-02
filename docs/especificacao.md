# Especificação

Fonte de verdade para a implementação do Protein Plate ("Protein without the diet"). O plano completo, com diagramas e fontes, está no documento "Plano do projeto: Protein Plate" (Claude Docs).

## 1. Produto

A app prova que atingir a meta diária de proteína é fácil: escolhes alimentos comuns em porções reais, vês a barra encher até à meta e geras receitas com esses alimentos. Sem dieta, sem contar calorias, sem proibir nada.

**Princípios** (cada funcionalidade é avaliada contra eles):

1. **Proteína sem dieta.** A app acrescenta, nunca restringe. Não há alimentos "maus".
2. **Comida de verdade.** Catálogo de alimentos naturais, ingredientes culinários e processados simples. Única exceção ultraprocessada, assinalada: proteína whey.
3. **Porções reais.** Números por porção que a pessoa reconhece; os 100 g ficam no detalhe.
4. **Zero culpa.** Abaixo da meta é "faltam 23 g", nunca vermelho nem "falhaste".
5. **Valor antes de registo.** Tudo funciona como convidado; a conta só guarda e sincroniza.
6. **Números fiáveis.** A proteína vem sempre da base de dados curada, nunca da IA.
7. **Simples por defeito.** Sem calorias, sem macros completos, sem registo diário obrigatório.

**Critério de sucesso do MVP:** uma pessoa nova chega a um dia que atinge a meta em menos de 2 minutos, sem criar conta.

**Fora do MVP:** calorias e macros completos, registo diário e histórico, produtos de marca, preços, lista de compras, notificações, app mobile.

**Depois do MVP:** v1.1 — inglês, preferências alimentares (vegetariano, sem lactose, exclusões), vários "dias tipo", receitas em streaming. v2 — Open Food Facts, lista de compras, custo por grama de proteína, app Expo sobre o mesmo backend.

## 2. Funcionalidades do MVP

| Funcionalidade | O que inclui | Critério de aceitação |
| --- | --- | --- |
| Meta e refeições | Peso + intensidade dão a meta; número de refeições (2 a 6) e refeição pós-treino opcional | Definido em menos de 45 s, sem conta |
| Catálogo | ~168 alimentos, proteína por porção, filtros por categoria, refeição e facilidade | "Snack sem preparação com mais proteína" em 2 toques |
| Detalhe do alimento | Porções, proteína por porção e por 100 g, ideias, fonte TCA | Adicionar ao dia a partir do detalhe |
| Dia exemplo | Gerado com as refeições da pessoa e os alimentos mais fáceis | Para metas de 80 a 250 g, total entre 100% e 110% |
| O meu dia ("Hoje") | Refeições, adicionar/remover, porções em passos de 0,5, barra de progresso | Total = soma exata das porções (testado) |
| Fechar a meta | "Faltam X g" e 3 sugestões | Cada sugestão cobre o que falta com 1 ou 2 porções |
| Receitas por IA | 2 a 6 alimentos, uma refeição da pessoa (com a sua meta), tempo máximo, doses | Ingredientes 100% da base de dados; resposta < 15 s |
| Página da receita | URL público, Open Graph | Abre sem conta |
| Conta opcional | Google e Apple; guardar meta, dia e receitas; importar dados de convidado | Sem duplicados depois do login |
| Base técnica | PWA, PT (EN preparado), páginas legais, exportar e apagar conta | Lighthouse mobile ≥ 90 nas 4 categorias |

## 3. Regras de domínio (`src/domain`)

Funções puras, sem I/O, 100% testadas. A UI e o servidor usam as mesmas funções.

### Meta diária

`meta = arredondar a múltiplos de 5 (peso_kg × intensidade)`

| Intensidade | g/kg | Rótulo |
| --- | --- | --- |
| base | 1,6 | "Para começar" |
| moderada | 1,8 | "Treino regular" |
| alta | 2,0 | "Treino intenso" (por defeito) |
| maxima | 2,2 | "Ganhar massa" |

- Peso aceite: 35 a 250 kg (fora disso, pedir confirmação).
- Meta manual opcional: 40 a 300 g.
- O peso fica só no browser.

### Refeições

Seis tipos, sempre nesta ordem: `pequeno-almoco`, `meio-da-manha`, `almoco`, `lanche`, `jantar`, `ceia`.

Onboarding com duas perguntas:

1. "Quantas refeições fazes por dia?" (2 a 6) — pré-seleciona a combinação; a pessoa pode alterar.
2. "Que refeição fazes a seguir ao treino?" (opcional) — marca uma das refeições escolhidas como pós-treino. Não cria refeição nova.

| N.º | Combinação pré-selecionada |
| --- | --- |
| 2 | almoço, jantar |
| 3 | pequeno-almoço, almoço, jantar |
| 4 | pequeno-almoço, almoço, lanche, jantar |
| 5 | pequeno-almoço, meio da manhã, almoço, lanche, jantar |
| 6 | pequeno-almoço, meio da manhã, almoço, lanche, jantar, ceia |

**Pesos:** principais (pequeno-almoço, almoço, jantar) = 2; intermédias (meio da manhã, lanche, ceia) = 1; a refeição pós-treino passa a valer 2.

`meta_refeicao = meta × peso_refeicao / soma_dos_pesos_escolhidos`

Exemplo: 160 g, 4 refeições → sem pós-treino ≈ 46/46/23/46 g; com lanche pós-treino = 40 g cada. Numa refeição pós-treino, sugestões e receitas privilegiam opções rápidas (`ease` 1).

### Proteína

`proteina_g = gramas × proteina_por_100g / 100`

- Cálculos com valores exatos; arredondar só na apresentação (inteiros a partir de 10 g; uma casa decimal abaixo).
- Total do dia = soma exata (pode diferir 1 g da soma das parcelas arredondadas; documentado em teste).
- Formatação com `Intl.NumberFormat('pt-PT')`.

### Peso de referência

Cada alimento tem `weightBasis`: `raw` (cru, para o que se cozinha), `cooked` ou `as_sold`. Usa-se a forma em que as pessoas medem (80 g de arroz cru, 1 lata de atum escorrido). As receitas usam a mesma base.

### Dia exemplo (determinístico)

1. Calcula a meta de cada refeição escolhida.
2. Em cada refeição, escolhe a fonte de proteína mais fácil para esse momento (maior `exampleRank`, compatível com `moments`) e um acompanhamento (`carb` ou `vegetable`).
3. Ajusta a fonte de proteína em passos de meia porção (1; 1,5; 2) até ao alvo da refeição.
4. Total abaixo da meta → acrescenta o snack com mais proteína por porção; acima de 110% → reduz o maior passo.
5. "Outras opções" troca as fontes com uma `seed`, mantendo o determinismo.

Teste property-based: para todas as metas de 80 a 250 g (passos de 5) e todas as combinações de refeições, total entre 100% e 110%.

### Fechar a meta

1. `falta = meta − total`; se ≤ 0, mostra meta atingida e não sugere nada.
2. Para cada alimento `role = protein`, calcula as porções que cobrem a falta (máximo 2).
3. Ordena pela diferença ao alvo, penalizando `ease` alto.
4. Devolve 3, de categorias diferentes.

## 4. Alimentos (`content/foods/*.json`)

O JSON é a fonte única: gera o seed da D1 e um módulo TypeScript tipado para as páginas estáticas. Um teste garante que coincidem.

| Campo | Tipo | Notas |
| --- | --- | --- |
| `id` | slug | estável; URLs e chaves estrangeiras (ex.: `atum-lata-natural`) |
| `name` | `{ pt, en }` | |
| `category` | enum | carne, peixe, marisco, conservas, ovos, laticinios, suplementos, soja, leguminosas, cereais, tuberculos, frutos-secos, sementes, fruta, legumes, despensa |
| `role` | enum | `protein`, `carb` (inclui fruta), `fat`, `vegetable`, `pantry` |
| `proteinPer100g` | número | da TCA |
| `kcalPer100g`, `carbsPer100g`, `fatPer100g` | número | guardados; não aparecem no MVP |
| `weightBasis` | enum | `raw`, `cooked`, `as_sold` |
| `processing` | enum | `natural`, `culinary`, `processed`, `ultra` (só ids em `PROCESSING_EXCEPTIONS`, ex.: whey) |
| `portions` | lista | `{ id, label: { pt, en }, grams, default? }`; exatamente uma `default` |
| `moments` | lista | tipos de refeição onde faz sentido |
| `ease` | 1 a 3 | 1 = sem preparação, 2 = rápido, 3 = cozinhar |
| `exampleRank` | inteiro | prioridade no dia exemplo |
| `tcaCode` | texto | rastreabilidade |
| `ideas` | `{ pt, en }` | ideias rápidas |

**`content:check`** valida: campos obrigatórios, ids únicos, proteína 0–90 g/100 g, porções 5–500 g (1–500 g na despensa: uma pitada de sal tem 1 g), uma porção `default`, `ultra` só para exceções.

**Curadoria:** partir de `docs/alimentos.csv`; copiar valores da TCA com o código; definir porções reais; incrementar `FOOD_DATA_VERSION` a cada alteração. Começar pelos 40 alimentos mais usados para desbloquear a UI.

**Fonte:** TCA do INSA (PortFIR). Confirmar termos de reutilização com o INSA antes de publicar; mostrar "Fonte: TCA, INSA". Alternativa: USDA FoodData Central.

## 5. Modelo de dados (D1)

Datas em `integer` (epoch ms), booleanos em `integer`, JSON em `text` validado com Zod; `snake_case` na base, `camelCase` no TypeScript.

| Tabela | Colunas principais | Regras |
| --- | --- | --- |
| `foods` | `id`, `name_pt`, `name_en`, `category`, `role`, `protein_per_100g`, `kcal_per_100g`, `carbs_per_100g`, `fat_per_100g`, `weight_basis`, `processing`, `ease`, `example_rank`, `tca_code`, `ideas_pt`, `ideas_en`, `data_version` | PK `id`; índice `(role, category)`; só o seed escreve |
| `food_portions` | `id`, `food_id`, `label_pt`, `label_en`, `grams`, `is_default` | FK `foods`; índice parcial único: uma `default` por alimento |
| `food_moments` | `food_id`, `moment` | PK `(food_id, moment)` |
| `user`, `session`, `account`, `verification` | Better Auth | sessões sem IP nem user agent |
| `profiles` | `user_id`, `daily_target_g`, `intensity`, `meals` (JSON), `post_workout_meal`, `locale`, `consent_version`, `consented_at`, `last_import_id`, `updated_at` | PK `user_id`, FK cascade; **sem peso** |
| `day_plans` | `id`, `user_id`, `name`, `position`, `updated_at` | FK cascade; único `(user_id, name)`; v1 usa um plano |
| `plan_items` | `id`, `plan_id`, `meal`, `food_id`, `portion_id`, `portion_count`, `position` | FK cascade para `day_plans`; `portion_count` 0,5–4 em passos de 0,5 (CHECK); ids gerados no servidor; sem FK para `foods` (o seed reescreve o catálogo e um alimento retirado não pode apagar dias) |
| `recipes` | `id` (curto), `cache_key`, `locale`, `title`, `summary`, `meal`, `post_workout`, `servings`, `variant` (1–3, migração 0001), `prep_minutes`, `steps` (JSON), `protein_per_serving_g`, `meal_target_g`, `model`, `prompt_version`, `food_data_version`, `input_tokens`, `output_tokens`, `created_at` | `cache_key` único; imutável; sem dono |
| `recipe_ingredients` | `recipe_id`, `position`, `food_id`, `grams` | PK `(recipe_id, position)` |
| `saved_recipes` | `user_id`, `recipe_id`, `saved_at` | PK composta; FK cascade |
| `usage_counters` | `key_hash`, `day`, `count` | PK `(key_hash, day)`; chaves sempre HMAC com chave diária (IP do convidado ou id do utilizador) ou `global`; cron apaga após 2 dias |

Apagar um utilizador apaga em cascata perfil, planos, itens, receitas guardadas, sessões e contas. As receitas geradas ficam (não têm dono).

### Estado de convidado (`localStorage`)

Chave versionada (`protein-plate:guest`), validada com Zod ao ler; versão antiga → migra (ex.: a intensidade numérica `2.0` passa a `"alta"`); inválido → recomeça sem rebentar. A intensidade guarda-se pela chave (`base`, `moderada`, `alta`, `maxima`).

```json
{
  "version": 1,
  "target": { "grams": 160, "intensity": "alta", "weightKg": 80, "manual": false },
  "meals": ["pequeno-almoco", "almoco", "lanche", "jantar"],
  "postWorkoutMeal": "lanche",
  "plan": {
    "items": [
      { "id": "b1", "meal": "pequeno-almoco", "foodId": "skyr-natural", "portionId": "skyr-natural:iogurte", "count": 1 }
    ],
    "seed": 0,
    "isExample": true
  },
  "updatedAt": 1793577600000
}
```

## 6. Receitas por IA (`POST /api/recipes`)

**Pedido** (só campos fechados, sem texto livre): `foodIds` (2–6), `meal` (uma das refeições da pessoa), `postWorkout` (boolean), `mealTargetG`, `maxMinutes` (10, 20, 30, 45), `servings` (1–4), `locale`, `turnstileToken` (convidados).

**Pipeline:**

1. Validar com Zod.
2. Turnstile (convidados), rate limiting (5/min por chave), quota diária.
3. Cache: `cache_key` = SHA-256 de alimentos ordenados + refeição + pós-treino + meta da refeição (arredondada a 5 g) + tempo + doses + idioma + `PROMPT_VERSION` + modelo + `FOOD_DATA_VERSION` + variante (1–3, "Gerar outra"). Se existir, devolve sem custo.
4. Modelo: `generateText` + `Output.object`, schema construído por pedido:
   - `title` ≤ 60, `summary` ≤ 140, `prepMinutes` ≤ `maxMinutes`
   - `ingredients`: 2–10 × `{ foodId: z.enum([...escolhidos, ...despensa]), grams }`
   - `steps`: 2–8, ≤ 240 caracteres
5. Validar: todas as fontes de proteína escolhidas presentes; gramas por dose ≤ 3 × porção `default`; proteína por dose (calculada pela app) entre 1 e 120 g.
6. Falha → 1 nova tentativa com o erro descrito; segunda falha → erro amigável, não conta para a quota.
7. Calcular proteína, guardar (`recipes` + `recipe_ingredients`), contar quota, devolver `id`.

**Prompt** versionado em `src/server/ai/prompts/recipe.v1.ts`: alimentos com nome e base de peso; usar todas as fontes de proteína; não inventar ingredientes; quantidades para a receita completa; português de Portugal; sem alegações de saúde; aproximar a proteína por dose da meta da refeição; pós-treino → receita rápida. A UI mostra quanto a receita cobre da meta.

**Modelo:** `AI_MODEL` (por defeito `claude-haiku-5-5`), timeout 20 s. `AI_MODE=mock` usa `MockLanguageModelV3` (local e testes).

**Quotas** (configuráveis): convidado 3 receitas novas/dia (chave = HMAC do IP com chave diária derivada de `IP_HASH_SECRET` + data); com conta 15/dia; global `AI_DAILY_LIMIT` (acima, só cache).

**Avaliações:** `eval:recipes` corre 20 combinações fixas e mede validade, ingredientes fora da lista, proteína plausível e latência. Corre antes de mudar prompt ou modelo; cada mudança incrementa `PROMPT_VERSION`.

## 7. Autenticação e modo convidado

- Better Auth em `/api/auth/[...all]`; só os endpoints usados ficam acessíveis (allowlist).
- **Google:** cliente OAuth Web; redirect `/api/auth/callback/google` por ambiente.
- **Apple:** App ID + Services ID novos (Services ID = `clientId`); domínio e return URL `/api/auth/callback/apple` registados; client secret JWT ES256 gerado na configuração com `jose` (180 dias); `trustedOrigins: ['https://appleid.apple.com']`. Não funciona em localhost — testar em staging. O email só vem na primeira autorização.
- **Regras de conta:** conta nova só a partir de "Criar conta", depois de aceitar termos e privacidade (versão guardada); sem ligação implícita entre contas com o mesmo email; apagar conta exige login recente com o mesmo provider; Apple revoga tokens.
- **Sincronização:** a cópia local guarda `owner` (id da conta); o servidor só aceita a sincronização se `owner` for o utilizador da sessão, e sair da conta apaga a cópia local (aparelhos partilhados).
- **Convidado → conta:** "Guardar o meu dia" → login → `/conta/bem-vindo` lê o estado local → Server Action `importGuestData` (Zod, ids existem, batch D1, idempotente com `importId`) → se já houver plano, perguntar qual manter → limpar estado local. O peso nunca é enviado.

## 8. Rotas e rendering

| Rota | Rendering |
| --- | --- |
| `/` | Estático |
| `/alimentos`, `/alimentos/[id]` | Estático, gerado do JSON no build; filtros no cliente |
| `/comecar` | Estático + Client Component |
| `/o-meu-dia` | Estático: o dia vive no browser (convidado) ou numa cópia local ligada à conta, que o `AccountSync` sincroniza com a D1 por Server Action (debounce); `/conta/bem-vindo` carrega a cópia da D1 |
| `/receitas/nova` | Dinâmico (lê a sessão e a chave do Turnstile) + Client Component |
| `/receitas/[id]` | Dinâmico, sem nada da pessoa; o Worker acrescenta `Cache-Control` público longo ao HTML (não aos pedidos RSC). O estado "guardada" vem depois, por Server Action |
| `/conta`, `/conta/bem-vindo` | Dinâmico, requer sessão |
| `/privacidade`, `/termos` | Estático |

Sem ISR (o catálogo muda com deploy): as páginas pré-renderizadas servem-se dos assets estáticos (`static-assets-incremental-cache` do OpenNext). Server Actions para mutações da UI; Route Handlers só onde há contrato público (`/api/recipes`, para a futura app) e `/api/health` (verificação do Worker).

**Idiomas sem middleware:** o proxy do Next 16 corre em Node, que no Workers ainda é experimental. Os pedidos das rotas da app (lista explícita `APP_ROUTES`; o routing do OpenNext não aceita lookaheads) são reescritos para `/pt/...` no `next.config.ts` e `/pt/...` redireciona (308) para o endereço sem prefixo; `/en` fica para a v1.1 (`ENABLED_LOCALES`).

## 9. Segurança e privacidade

- User ID só da sessão; ownership antes de cada escrita; Zod em todas as fronteiras.
- Cookies `HttpOnly`, `Secure`, `SameSite=Lax`; limites de tamanho de pedidos.
- HSTS acrescentado pelo Worker só em HTTPS (o preview em `http://localhost` continua a funcionar).
- Cabeçalhos: CSP restrita (próprio domínio + Turnstile + providers de login), HSTS, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restritiva, `frame-ancestors 'none'`.
- A IA só recebe ids e nomes de alimentos.
- Sem analytics de terceiros (opcional: Cloudflare Web Analytics, sem cookies). D1 na UE. Exportar dados (JSON) e apagar conta na app. Idade mínima 16 anos para conta.
- **Avisos:** landing e meta — "Informação geral, não substitui um nutricionista ou médico. Se tens uma doença renal, estás grávida ou tens outra condição de saúde, fala com um profissional antes de aumentar a proteína." Receitas — "Gerada por IA. A proteína é calculada a partir da TCA. Confirma alergénios e intolerâncias."

## 10. Ecrãs

1. **Landing:** "Proteína sem dieta", 3 passos, exemplo de um dia, FAQ, aviso, CTA "Calcular a minha meta".
2. **Começar:** peso, 4 cartões de intensidade, número de refeições com combinação pré-selecionada, pós-treino opcional, resultado ("A tua meta: 160 g por dia") e "Vê como é fácil".
3. **Hoje:** barra de progresso fixa, refeições pela ordem do dia (etiqueta pós-treino), itens com stepper de meia porção, painel "Para fechar a meta", "Gerar receita com estes alimentos" por refeição, "Guardar o meu dia".
4. **Adicionar alimento:** painel inferior com pesquisa, filtros e os mais fáceis para a refeição.
5. **Catálogo:** pesquisa, chips de filtros, ordenação, cartões com proteína por porção em destaque.
6. **Detalhe:** porções com proteína, valor por 100 g, ideias, fonte, "Adicionar ao meu dia".
7. **Nova receita:** alimentos pré-selecionados, refeição, tempo, doses, Turnstile; estados a gerar / erro / quota esgotada.
8. **Receita:** proteína por dose e quanto cobre da meta da refeição, tempo, ingredientes, passos, guardar, partilhar, gerar outra, aviso IA.
9. **Conta:** login, meta e refeições, receitas guardadas, exportar, apagar.

Navegação: barra inferior no telemóvel (Hoje, Alimentos, Receitas, Conta), superior no desktop. Tom: tu, frases curtas, sempre o próximo passo ("Faltam 23 g. Um skyr resolve.").

## 11. Design

- Direção "cozinha, não ginásio": tons quentes; o número de proteína grande (tabular) como assinatura; barra de progresso grossa.
- Tokens (claro / escuro): `--bg` #FBF8F3 / #12110F · `--surface` #FFFFFF / #1C1A17 · `--text` #1F1B16 / #F3EEE7 · `--text-muted` #6B6258 / #A99F93 · `--primary` #2F6B3A / #6FBF7A · `--accent` #F2B33D / #F5C25E (só fundo) · `--track` #EAE3D8 / #2A2723 · `--danger` #B3261E / #F2B8B5 (só erros técnicos).
- Tipografia: Bricolage Grotesque (títulos, números) + Figtree (texto); escala 12/14/16/20/24/32/56; `tabular-nums`.
- Componentes próprios: `ProteinNumber`, `GoalProgress`, `MealSection`, `PortionStepper`, `FoodCard`, `SuggestionChip`, `RecipeCard`, `FilterChips`, Drawer de adicionar.
- Movimento 150–250 ms `ease-out`; nada com `prefers-reduced-motion`.
- A11y: contraste ≥ 4,5:1, alvos ≥ 44 px, foco visível, teclado em tudo, `aria-live` para "Faltam X g", `lang="pt-PT"`.

## 12. Qualidade

| Nível | Ferramenta | Cobre |
| --- | --- | --- |
| Domínio | Vitest + fast-check | 100% de `src/domain` |
| Conteúdo | Vitest | JSON válido, seed = módulo tipado |
| Servidor | Vitest numa D1 local real | ownership com 2 utilizadores, importação idempotente, quotas, validação de receitas com modelo simulado |
| E2E | Playwright contra `preview` | primeira utilização, ajustar o dia, gerar receita (mock) |
| A11y | axe-core + Lighthouse CI | páginas principais, claro e escuro |
| IA | `eval:recipes` | antes de mudar prompt/modelo |

**CI:** PR → lint, typecheck, content:check, testes, build OpenNext, e2e, Lighthouse. Merge em `main` → deploy staging + migrações. Produção → `workflow_dispatch` manual depois da checklist.

**Observabilidade:** Workers Logs em JSON (id do pedido, rota, estado, duração, código de erro; sem PII); por geração: modelo, tokens, latência, resultado da validação.
