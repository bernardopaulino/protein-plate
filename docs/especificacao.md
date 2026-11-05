# Especificação

Fonte de verdade para a implementação do Protein Plate ("Protein without the diet"). O plano completo, com diagramas e fontes, está no documento "Plano do projeto: Protein Plate" (Claude Docs).

## 1. Produto

A app prova que atingir a meta diária de proteína é fácil: escolhes alimentos comuns em porções reais, vês a barra encher até à meta e geras receitas com esses alimentos. Sem dieta, sem contar calorias, sem proibir nada.

**Princípios** (cada funcionalidade é avaliada contra eles):

1. **Proteína sem dieta.** A app acrescenta, nunca restringe. Não há alimentos "maus".
2. **Comida de verdade.** Catálogo de alimentos naturais, ingredientes culinários e processados simples. Única exceção ultraprocessada, assinalada: proteína whey.
3. **Porções reais.** Números por porção que a pessoa reconhece; os 100 g ficam no detalhe.
4. **Zero culpa.** Abaixo da meta é "faltam 23 g", nunca vermelho nem "falhaste".
5. **Personalizado desde o início.** Login obrigatório (Google ou Apple) e um formulário de boas-vindas curto; a página inicial e o catálogo continuam abertos. Decidido a 3/11/2026: a conta guarda as preferências que tornam o dia e as receitas da pessoa.
6. **Números fiáveis.** A proteína vem sempre da base de dados curada, nunca da IA.
7. **Simples por defeito.** Sem calorias, sem macros completos, sem registo diário obrigatório.

**Critério de sucesso do MVP:** uma pessoa nova chega, em menos de 2 minutos depois de entrar, a um dia que atinge a meta com os alimentos de que gosta.

**Fora do MVP:** calorias e macros completos, registo diário e histórico, produtos de marca, preços, lista de compras, notificações, app mobile.

**Depois do MVP:** v1.1 — inglês, vários "dias tipo", receitas em streaming, histórico do peso. v2 — Open Food Facts, lista de compras, custo por grama de proteína, app Expo sobre o mesmo backend.

## 2. Funcionalidades do MVP

| Funcionalidade | O que inclui | Critério de aceitação |
| --- | --- | --- |
| Entrar | Google ou Apple numa só página (`/entrar`); contas novas aceitam os termos ao continuar | Sem sessão, as páginas da app levam a `/entrar` e voltam depois |
| Formulário de boas-vindas | 6 passos (`/comecar`): meta, refeições (pré e pós-treino), restrições, alimentos de que gosta, cozinha, resumo | Obrigatório antes do dia e das receitas; menos de 2 minutos; editável em `/conta/preferencias` |
| Catálogo | ~168 alimentos com ilustração, proteína por porção, filtros por categoria, refeição e facilidade | "Snack sem preparação com mais proteína" em 2 toques; público |
| Detalhe do alimento | Porções, proteína por porção e por 100 g, ideias, fonte TCA | Adicionar ao dia a partir do detalhe |
| Dia exemplo | Gerado com as refeições da pessoa, só com o que pode comer e os alimentos de que gosta primeiro | Para metas de 80 a 250 g, total entre 100% e 110% |
| O meu dia ("Hoje") | Refeições, adicionar/remover, porções em passos de 0,5, barra de progresso | Total = soma exata das porções (testado); nunca mostra alimentos excluídos |
| Fechar a meta | "Faltam X g" e 3 sugestões | Cada sugestão cobre o que falta com 1 ou 2 porções, das que a pessoa pode comer |
| Receitas por IA | Uma refeição da pessoa; alimentos opcionais (0 a 6, a app completa a base com o que a pessoa gosta), tempo, doses; opcional: proteína por dose à escolha (10–100 g, senão a meta da refeição) e eletrodomésticos para esta receita (ou "Sem cozinhar"); treino e dieta vêm do perfil | Ingredientes 100% da base de dados e dentro das restrições; proteína à escolha a menos de 20% do pedido; resposta < 15 s |
| Dia completo | `/receitas/dia`: uma receita por refeição do plano, cada uma com a meta dessa refeição e alimentos diferentes; tempo, doses e eletrodomésticos; "Pôr o dia todo no meu dia" | Todas em paralelo (< 15 s); quota suficiente para o dia todo antes de gerar; uma falha não estraga as outras |
| Página da receita | URL público, Open Graph | Abre sem conta |
| Conta | Preferências, exportar e apagar | Exportar inclui tudo o que a app guarda |
| Livro de receitas | `/receitas`: duas entradas no topo ("Uma receita" e "O dia todo"); separadores Guardadas (favoritas primeiro, filtro "Só favoritas") e Recentes (as últimas 50 geradas), com filtro por refeição; na receita, "Pôr no meu dia" troca os alimentos dessa refeição por uma dose da receita | O "Hoje" mostra "Receita: …" na refeição; a proteína continua calculada pela app |
| Backoffice | Painel, utilizadores, receitas, alimentos e duas ações (ver `docs/backoffice.md`) | Atrás do Cloudflare Access; sem dados de saúde por pessoa |
| Base técnica | PWA, PT (EN preparado), páginas legais, motion com `prefers-reduced-motion` | Lighthouse mobile ≥ 90 nas 4 categorias |

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
- Meta manual opcional: 40 a 300 g (sem peso).
- O peso guarda-se na conta só com o consentimento explícito de dados de saúde (secção 9); a meta calcula-se no servidor.

### Refeições

Seis tipos, sempre nesta ordem: `pequeno-almoco`, `meio-da-manha`, `almoco`, `lanche`, `jantar`, `ceia`.

No formulário de boas-vindas:

1. "Quantas refeições fazes?" (2 a 6) — pré-seleciona a combinação; a pessoa pode alterar.
2. "Treinas?" — se sim, marca (opcional) uma refeição antes do treino e outra depois. Não cria refeições novas; as duas têm de ser diferentes (se coincidirem, fica a pós-treino).

| N.º | Combinação pré-selecionada |
| --- | --- |
| 2 | almoço, jantar |
| 3 | pequeno-almoço, almoço, jantar |
| 4 | pequeno-almoço, almoço, lanche, jantar |
| 5 | pequeno-almoço, meio da manhã, almoço, lanche, jantar |
| 6 | pequeno-almoço, meio da manhã, almoço, lanche, jantar, ceia |

**Pesos:** principais (pequeno-almoço, almoço, jantar) = 2; intermédias (meio da manhã, lanche, ceia) = 1; a refeição pós-treino passa a valer 2.

`meta_refeicao = meta × peso_refeicao / soma_dos_pesos_escolhidos`

Exemplo: 160 g, 4 refeições → sem pós-treino ≈ 46/46/23/46 g; com lanche pós-treino = 40 g cada. Numa refeição pós-treino, sugestões e receitas privilegiam opções rápidas (`ease` 1). A pré-treino não muda o peso: o dia exemplo escolhe hidratos e uma proteína rápida e leve (`ease` ≤ 2, gordura ≤ 10 g/100 g) e o prompt pede uma refeição leve.

### Preferências (`src/domain/preferences.ts`)

- **Dieta:** `omnivore`, `pescatarian` (sem carne), `vegetarian` (sem carne nem peixe), `vegan` (só origem vegetal). A origem vem da categoria (`carne`; `peixe`, `marisco`, `conservas`; `ovos`; `laticinios`, `suplementos`), com exceções na despensa (manteiga = laticínio, mel = animal).
- **Alergias e intolerâncias:** `milk`, `gluten`, `egg`, `fish`, `shellfish` (crustáceos e moluscos), `tree-nuts`, `peanut`, `soy`, `sesame`, `lupin`, `mustard`. Cada alimento tem `allergens` (secção 4).
- **As restrições são absolutas:** um alimento excluído nunca entra no dia, nas sugestões, na despensa das receitas nem na lista do modelo; o servidor volta a filtrar o que chega do cliente.
- **Alimentos de que gosta:** ids do catálogo (sem a despensa), limpos das restrições; pelo menos 3 fontes de proteína (`MIN_LIKED_PROTEINS`). Escolhem-se por grupos (`src/domain/food-groups.ts`): 5 secções (proteína, hidratos, fruta, legumes, frutos secos e sementes) e 25 subgrupos (aves, carne, peixe, conservas, marisco, ovos, leite e iogurtes, queijos, leguminosas, soja e tofu; pão, arroz e massa, aveia e cereais, batata e tubérculos; fruta do dia a dia, frutos vermelhos, de verão e tropical, outras; folhas, brócolos e couves, para salada, para cozinhar; frutos secos, amendoim, sementes e tahini). O subgrupo vem da categoria, com exceções por id; cada alimento fora da despensa tem um (teste).
- **Cozinha:** tempo habitual (10, 20, 30, 45 min; pré-seleciona o tempo das receitas) e equipamento (`stove`, `oven`, `microwave`, `airfryer`, `blender`; pelo menos um).

### Proteína

`proteina_g = gramas × proteina_por_100g / 100`

- Cálculos com valores exatos; arredondar só na apresentação (inteiros a partir de 10 g; uma casa decimal abaixo).
- Total do dia = soma exata (pode diferir 1 g da soma das parcelas arredondadas; documentado em teste).
- Formatação com `Intl.NumberFormat('pt-PT')`.

### Peso de referência

Cada alimento tem `weightBasis`: `raw` (cru, para o que se cozinha), `cooked` ou `as_sold`. Usa-se a forma em que as pessoas medem (80 g de arroz cru, 1 lata de atum escorrido). As receitas usam a mesma base.

### Dia exemplo (determinístico)

0. Só entram os alimentos que a pessoa pode comer; entre eles, os de que gosta vêm primeiro (os outros só quando faltam opções para uma refeição).
1. Calcula a meta de cada refeição escolhida.
2. Em cada refeição, escolhe a fonte de proteína mais fácil para esse momento (maior `exampleRank`, compatível com `moments`) e um acompanhamento (`carb` ou `vegetable`).
3. Ajusta a fonte de proteína em passos de meia porção (1; 1,5; 2) até ao alvo da refeição.
4. Total abaixo da meta → acrescenta o snack com mais proteína por porção; acima de 110% → reduz o maior passo.
5. "Outras opções" troca as fontes com uma `seed`, mantendo o determinismo.

Teste property-based: para todas as metas de 80 a 250 g (passos de 5) e todas as combinações de refeições, total entre 100% e 110%; e, por amostra, o mesmo com dietas, alergias, alimentos escolhidos e refeições de treino aleatórios.

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
| `allergens` | lista | alergénios (secção 3, "Preferências"); `[]` se não tiver |
| `tcaCode` | texto | rastreabilidade: código do item na TCA, `REF` (valores de referência revistos, sem código confirmado) ou `TODO` (por rever; recusado em produção) |
| `ideas` | `{ pt, en }` | ideias rápidas |

**Ilustrações:** cada alimento tem uma ilustração (Microsoft Fluent Emoji 3D, MIT) em `public/images/foods`, gerada por `scripts/fetch-food-images.ts` (WebP 160 px, ~450 KB no total) com o mapa em `src/content/food-images.generated.ts`.

**`content:check`** valida: campos obrigatórios, ids únicos, alergénios conhecidos e sem repetidos, proteína 0–90 g/100 g, porções 5–500 g (1–500 g na despensa: uma pitada de sal tem 1 g), uma porção `default`, `ultra` só para exceções.

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
| `profiles` | `user_id`, `daily_target_g`, `intensity`, `weight_kg`, `manual_target`, `meals` (JSON), `pre_workout_meal`, `post_workout_meal`, `diet`, `allergies` (JSON), `liked_foods` (JSON), `equipment` (JSON), `cook_minutes`, `locale`, `consent_version`, `consented_at`, `health_consent_at`, `onboarded_at`, `last_import_id` (obsoleto), `updated_at` | PK `user_id`, FK cascade; preferências na migração 0002; `weight_kg` e `allergies` só com `health_consent_at` |
| `day_plans` | `id`, `user_id`, `name`, `position`, `updated_at` | FK cascade; único `(user_id, name)`; v1 usa um plano |
| `plan_items` | `id`, `plan_id`, `meal`, `food_id`, `portion_id`, `portion_count`, `position` | FK cascade para `day_plans`; `portion_count` 0,5–4 em passos de 0,5 (CHECK); ids gerados no servidor; sem FK para `foods` (o seed reescreve o catálogo e um alimento retirado não pode apagar dias) |
| `recipes` | `id` (curto), `cache_key`, `locale`, `title`, `summary`, `meal`, `post_workout`, `servings`, `variant` (1–3, migração 0001), `prep_minutes`, `steps` (JSON), `protein_per_serving_g`, `meal_target_g` (o alvo da receita: a meta da refeição ou a proteína escolhida), `custom_target` (a proteína foi escolhida pela pessoa, migração 0005), `equipment` (JSON, vazio = sem cozinhar; null antes da 0005), `model`, `prompt_version`, `food_data_version`, `input_tokens`, `output_tokens`, `created_at` | `cache_key` único; imutável; sem dono |
| `recipe_ingredients` | `recipe_id`, `position`, `food_id`, `grams` | PK `(recipe_id, position)` |
| `saved_recipes` | `user_id`, `recipe_id`, `saved_at`, `favorite` | PK composta; FK cascade; `favorite` na migração 0003 (marcar como favorita também guarda) |
| `user_recipes` | `user_id`, `recipe_id`, `created_at` | Histórico ("Recentes"): gravado em cada receita gerada ou servida da cache; só as últimas 50 por pessoa; FK cascade |
| `meal_recipes` | `user_id`, `meal`, `recipe_id`, `used_at` | A receita posta numa refeição do dia (PK `user_id, meal`); desaparece quando a refeição fica vazia; FK cascade |
| `usage_counters` | `key_hash`, `day`, `count` | PK `(key_hash, day)`; chaves sempre HMAC com chave diária (IP do convidado ou id do utilizador) ou `global`; cron apaga após 2 dias |
| `ops_counters` | `day` (AAAA-MM-DD, UTC), `metric`, `count` | PK `(day, metric)`; contadores do funcionamento para o backoffice (migração 0004), só nomes de `OPS_METRICS` (secção 12); upsert que soma; cron apaga após 90 dias |

Apagar um utilizador apaga em cascata perfil, planos, itens, receitas guardadas, histórico de receitas, receitas das refeições, sessões e contas. As receitas geradas ficam (não têm dono).

### O dia (só na conta)

Desde 3/11/2026 o dia **vive só na D1**. O `/o-meu-dia` carrega-o do servidor em cada visita; cada mudança aparece logo no ecrã e grava-se a seguir com `saveDayAction` (só os itens, schema `strict`, debounce de 500 ms; um pedido de cada vez, sempre com o dia mais recente; grava logo ao esconder o separador). O ecrã mostra "A guardar…", "Guardado na tua conta." ou o erro com "Tentar outra vez". A meta, as refeições e as preferências vêm sempre do perfil. Não há cópia no browser: a chave antiga `protein-plate:guest` (que tinha o peso) é apagada ao abrir o "Hoje" e ao sair da conta. O "Adicionar ao meu dia" do catálogo usa `addToDayContextAction` (refeições da pessoa e se o alimento cabe nas restrições) e `addToDayAction` (soma porções se já lá estiver).

> Porquê: com a cópia local, um separador aberto com uma versão anterior da app apagava a cópia nova (versão desconhecida → inválida) e o "Hoje" mostrava "Ainda não tens uma meta"; o envio para a D1 também tinha deixado de ser aceite. Com login obrigatório, a cópia já não trazia nada.

```json
{
  "version": 2,
  "target": { "grams": 160, "intensity": "alta", "weightKg": 80, "manual": false },
  "meals": ["pequeno-almoco", "almoco", "lanche", "jantar"],
  "preWorkoutMeal": "lanche",
  "postWorkoutMeal": "jantar",
  "plan": {
    "items": [
      { "id": "b1", "meal": "pequeno-almoco", "foodId": "skyr-natural", "portionId": "skyr-natural:iogurte", "count": 1 }
    ],
    "seed": 0,
    "isExample": true
  },
  "updatedAt": 1793577600000,
  "owner": "user-id"
}
```

## 6. Receitas por IA (`POST /api/recipes`)

**Pedido** (só campos fechados, sem texto livre): `foodIds` (0–6, opcional), `meal` (uma das refeições da pessoa), `maxMinutes` (10, 20, 30, 45), `servings` (1–4), `locale`, `variant` e, opcionais, `targetProteinG` (10–100 g por dose; sem ele, a meta da refeição) e `equipment` (0–5 eletrodomésticos para esta receita; sem ele, os do perfil; vazio = "Sem cozinhar"). Exige sessão (401 `unauthorized`) e formulário concluído (403 `onboarding_required`). A meta da refeição, o pré/pós-treino e a dieta vêm do perfil, nunca do pedido. "Sem cozinhar" com um alimento escolhido que precisa de lume (`ease` 3) → 400 `needs_cooking`.

**Pipeline:**

1. Validar com Zod; a refeição tem de ser da pessoa (`invalid_request`) e os alimentos têm de caber nas restrições (`restricted_food`). A despensa é filtrada pelas restrições.
2. **Base** (`src/domain/recipe-base.ts`): o que a pessoa escolheu, completado pela app com uma fonte de proteína (leve antes do treino) e, se houver espaço, hidratos e legumes ao almoço e ao jantar ou hidratos (podem ser fruta) nas outras refeições; escolhe primeiro entre os alimentos de que a pessoa gosta e que servem para a refeição, e, quando é ela a escolher a proteína, prefere fontes que chegam ao alvo em quantidades realistas (`proteinReach` = 3 porções habituais) e junta outra se nenhuma chegar a 85% do alvo; as proteínas escolhidas pela pessoa ficam como estão (só as quantidades se ajustam). Com "Sem cozinhar", só completa com alimentos `ease` 1. Com alimentos escolhidos, a base é estável (muda com a variante, a cache funciona); sem nada escolhido, cada pedido usa uma seed aleatória e traz outra combinação.
3. Rate limiting (5/min por chave), quota diária por conta.
4. Cache: `cache_key` = SHA-256 de alimentos ordenados + refeição + pós-treino + pré-treino + alvo de proteína (arredondado a 5 g) + se foi escolhido pela pessoa + despensa permitida + equipamento + tempo + doses + idioma + `PROMPT_VERSION` + modelo + `FOOD_DATA_VERSION` + variante (1–3, "Gerar outra"). Se existir, devolve sem custo.
5. Modelo (`src/server/recipes/model-call.ts`, partilhado com `eval:recipes`): `generateText` + `Output.object` com um **schema fixo**, igual em todos os pedidos (a API compila uma gramática por schema e guarda-a 24 h; um schema por pedido pagava essa compilação em cada receita):
   - `title` ≤ 60, `summary` ≤ 140, `prepMinutes` ≤ 45
   - `ingredients`: 2–10 × `{ foodId: string, grams }`
   - `steps`: 2–8, ≤ 240 caracteres
6. Ingredientes repetidos: a app junta-os (soma as gramas), sem nova chamada. **Ajuste da proteína** (`src/domain/recipe-fit.ts`): se a proteína por dose ficar a mais de 10% do alvo, a app muda só as quantidades das fontes de proteína (×0,4 a ×2,5, entre 20 g e 3 porções habituais por dose; múltiplos de 5 g e ovos inteiros); os acompanhamentos e a despensa ficam como a IA os escreveu. Validar: só ids da lista enviada (escolhidos + despensa permitida); `prepMinutes` ≤ `maxMinutes`; todas as fontes de proteína escolhidas presentes; gramas por dose ≤ 3 × porção `default`; proteína por dose (calculada pela app) entre 1 e 120 g; com a proteína escolhida pela pessoa, a menos de 20% do pedido depois do ajuste.
7. Falha → 1 nova tentativa com o erro descrito, só se ainda faltarem ≥ 5 s do prazo total de 14 s (cada tentativa tem como timeout o tempo que falta). Sem receita dentro do prazo → erro amigável, não conta para a quota.
8. Calcular proteína, guardar (`recipes` + `recipe_ingredients`), contar quota, devolver `id`.

**Prompt** versionado em `src/server/ai/prompts/recipe.v3.ts` (`PROMPT_VERSION` 3): alimentos com nome, base de peso, porção habitual e proteína por 100 g; usar todas as fontes de proteína; não inventar ingredientes; quantidades para a receita completa; português de Portugal; sem alegações de saúde; aproximar a proteína por dose do alvo ("a pessoa quer X g" quando foi escolhida); passos sem gramas nem quantidades (a app pode ajustá-las); pós-treino → receita rápida; pré-treino → leve, com hidratos e pouca gordura; só o equipamento disponível ("a pessoa quer cozinhar com…" quando o escolheu para a receita; "sem cozinhar: só se monta" quando não há nenhum); nota da dieta (sem carne, vegetariana, vegana). Nunca leva o nome, o peso nem as alergias (os alimentos com alergénios simplesmente não estão na lista). A UI mostra quanto a receita cobre da meta da refeição ou "Pediste X g por dose", e com o que se cozinha.

**Modelo:** `AI_MODEL` (por defeito `claude-haiku-5-5`), effort `low` e thinking desligado (`src/server/ai/model.ts`), prazo total de 14 s por receita. Medido a 4/11/2026: p50 ≈ 3 s, p95 ≈ 6–7 s, contra 8 s / 12,5 s com o thinking por defeito. Com o prompt 3 (5/11/2026): 24/24 válidas à primeira, p50 2,5 s, p95 4 s. `AI_MODE=mock` usa `MockLanguageModelV3` (local e testes).

**Dia completo** (`POST /api/recipes/day`, `src/server/recipes/generate-day.ts`): pedido `{ maxMinutes, servings, locale, equipment? }`. As bases saem de `src/domain/recipe-day.ts` (uma por refeição, com a meta dessa refeição, sem repetir alimentos entre refeições enquanto houver alternativas). Conta uma vez no rate limiting; a quota tem de chegar para todas as refeições (senão 429 `quota_exceeded` com `remaining`); as receitas geram-se em paralelo com o pipeline normal e a resposta traz, por refeição, o `id` ou o código do erro. O ecrã do resultado é `/receitas/dia/ver?r=<refeição>.<id>,…&f=<refeições sem receita>` e "Pôr o dia todo no meu dia" (`applyRecipeDayAction` → `applyRecipesToDay`, numa só escrita, tudo ou nada).

**Quotas** (configuráveis): 15 receitas novas/dia por conta (`QUOTA_USER`; chave = HMAC do id da conta com chave diária derivada de `IP_HASH_SECRET` + data); global `AI_DAILY_LIMIT` (acima, só cache). O Turnstile e a quota de convidados saíram com o login obrigatório.

**Avaliações:** `eval:recipes` corre 24 combinações fixas (4 com a proteína escolhida, eletrodomésticos escolhidos ou sem cozinhar) com a mesma chamada do servidor e mede validade, ingredientes fora da lista, proteína plausível, latência (p50/p95) e tokens; guarda o texto de cada receita em `eval-results/` para rever à mão. Critério: ≥ 90% válidas e p95 < 15 s. Corre antes de mudar prompt, modelo, effort ou thinking; cada mudança do prompt incrementa `PROMPT_VERSION`.

## 7. Autenticação (login obrigatório)

- Better Auth em `/api/auth/[...all]`; só os endpoints usados ficam acessíveis (allowlist).
- **Login obrigatório** para a app (decidido a 3/11/2026). Públicos: `/`, `/alimentos`, `/alimentos/[id]`, `/receitas/[id]`, `/entrar`, páginas legais. As páginas com login usam `requireSession`/`requireProfile` (`src/server/auth/guard.ts`): sem sessão → `/entrar?next=…` (só caminhos internos); sem formulário concluído → `/comecar`.
- **Google:** cliente OAuth Web; redirect `/api/auth/callback/google` por ambiente.
- **Apple:** App ID + Services ID novos (Services ID = `clientId`); domínio e return URL `/api/auth/callback/apple` registados; client secret JWT ES256 gerado na configuração com `jose` (180 dias); `trustedOrigins: ['https://appleid.apple.com']`. Não funciona em localhost — testar em staging. O email só vem na primeira autorização.
- **Entrar = criar conta:** uma só página; ao continuar, a pessoa aceita os termos (`CONSENT_VERSION` 2), o que põe o cookie curto que o Better Auth exige para criar a conta (`requestSignUp`; uma conta existente entra normalmente). Sem ligação implícita entre contas com o mesmo email; apagar conta exige login recente com o mesmo provider; Apple revoga tokens.
- **Depois do login:** `/conta/bem-vindo` regista o consentimento (contas novas) e segue para `/comecar` (sem formulário concluído) ou para `next`.
- **Testes:** `scripts/dev-session.ts` cria uma pessoa e uma sessão na D1 local e devolve o cookie assinado (e2e e desenvolvimento; nunca toca em staging nem em produção).

## 8. Rotas e rendering

| Rota | Rendering |
| --- | --- |
| `/` | Estático (o dia exemplo anima-se no cliente) |
| `/alimentos`, `/alimentos/[id]` | Estático, gerado do JSON no build; filtros no cliente |
| `/entrar` | Dinâmico (com sessão, segue para `next`) |
| `/comecar` | Dinâmico, requer sessão; formulário de boas-vindas (Client Component) |
| `/o-meu-dia` | Dinâmico, requer perfil: o servidor manda o dia e as preferências; as mudanças aparecem logo e gravam-se na conta (`saveDayAction`) |
| `/receitas`, `/receitas/nova`, `/receitas/dia`, `/receitas/dia/ver` | Dinâmico, requer perfil (fora do sitemap e com `Disallow` no robots) |
| `/receitas/[id]` | Dinâmico, sem nada da pessoa; o Worker acrescenta `Cache-Control` público longo ao HTML (não aos pedidos RSC). O estado "guardada" vem depois, por Server Action |
| `/conta`, `/conta/preferencias`, `/conta/bem-vindo` | Dinâmico, requer sessão (e perfil, exceto bem-vindo) |
| `/privacidade`, `/termos` | Estático |

`/conta/criar` redireciona (308) para `/entrar`. Sem ISR (o catálogo muda com deploy): as páginas pré-renderizadas servem-se dos assets estáticos (`static-assets-incremental-cache` do OpenNext). Server Actions para mutações da UI; Route Handlers só onde há contrato público (`/api/recipes`, para a futura app) e `/api/health` (verificação do Worker).

**Idiomas sem middleware:** o proxy do Next 16 corre em Node, que no Workers ainda é experimental. Os pedidos das rotas da app (lista explícita `APP_ROUTES`; o routing do OpenNext não aceita lookaheads) são reescritos para `/pt/...` no `next.config.ts` e `/pt/...` redireciona (308) para o endereço sem prefixo; `/en` fica para a v1.1 (`ENABLED_LOCALES`).

## 9. Segurança e privacidade

- User ID só da sessão; ownership antes de cada escrita; Zod em todas as fronteiras.
- Cookies `HttpOnly`, `Secure`, `SameSite=Lax`; limites de tamanho de pedidos.
- HSTS acrescentado pelo Worker só em HTTPS (o preview em `http://localhost` continua a funcionar).
- Cabeçalhos: CSP restrita (próprio domínio + providers de login; sem Turnstile desde o login obrigatório), HSTS, `nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restritiva, `frame-ancestors 'none'`.
- A IA só recebe ids e nomes de alimentos, a refeição, o equipamento e a dieta.
- **Dados de saúde (RGPD, art. 9.º):** o peso e as alergias só se guardam com consentimento explícito (caixa no resumo do formulário, `health_consent_at`); sem consentimento, a pessoa escreve a meta à mão e não indica alergias. Exportar inclui-os; apagar a conta apaga-os. O backoffice nunca os mostra por pessoa (só contagens agregadas, com "<5" abaixo de 5).
- Os contadores do funcionamento (`ops_counters`) são só nomes de um conjunto fixo e totais por dia: nunca o utilizador, o email, o IP, os alimentos ou o corpo de um pedido.
- Sem analytics de terceiros (opcional: Cloudflare Web Analytics, sem cookies). D1 na UE. Exportar dados (JSON) e apagar conta na app. Idade mínima 16 anos para conta.
- **Avisos:** landing e meta — "Informação geral, não substitui um nutricionista ou médico. Se tens uma doença renal, estás grávida ou tens outra condição de saúde, fala com um profissional antes de aumentar a proteína." Receitas — "Gerada por IA. A proteína é calculada a partir da TCA. Confirma alergénios e intolerâncias."

## 10. Ecrãs

1. **Página inicial:** "Proteína sem dieta", 3 passos com ilustrações, o dia exemplo animado, FAQ, aviso, CTA "Começar agora".
2. **Entrar:** benefícios, Google e Apple, "Ao continuar, aceitas os Termos e a Política de Privacidade".
3. **Formulário de boas-vindas** (6 passos, barra de progresso, transições laterais, barra de ações fixa em baixo): meta (peso com o resultado ao vivo, intensidade em cartões; meta manual opcional), refeições (número, quais, treino com pré e pós), restrições (dieta em cartões, alergias), alimentos ("Como de tudo", secções em separadores, subgrupos com ilustração própria que se escolhem inteiros e abrem para afinar alimento a alimento, pesquisa; 3 fontes de proteína no mínimo, com um aviso só se faltarem), cozinha (tempo e equipamento), resumo (meta, meta por refeição, tudo editável, consentimento de dados de saúde) → "Tudo pronto!" → Hoje. O mesmo formulário edita as preferências na conta.
4. **Hoje:** barra de progresso fixa, refeições pela ordem do dia (etiquetas pré e pós-treino), itens com stepper de meia porção, painel "Para fechar a meta", "Gerar receita com estes alimentos" por refeição.
5. **Adicionar alimento:** painel inferior com pesquisa, filtros, os favoritos e os mais fáceis para a refeição primeiro; só alimentos permitidos.
6. **Catálogo:** pesquisa; os mesmos grupos do formulário (Todos, Proteína, Hidratos, Fruta, Legumes, Frutos secos e sementes) em cartões com ilustração e contagem, que cabem sempre no ecrã (3 por linha no telemóvel, 6 no desktop); uma barra com refeição, preparação e ordem (seletores com nome, sem chips a sair do ecrã); resultados agrupados por subgrupo (ou por grupo em "Todos"), os de mais proteína primeiro; os filtros ficam ao voltar do detalhe (sessão).
7. **Detalhe:** porções com proteína, valor por 100 g, ideias, fonte, "Adicionar ao meu dia".
8. **Nova receita:** refeição e "Gerar receita" chegam (a app escolhe a base); "Proteína por dose" (a meta da refeição ou "Escolho eu", com − / + de 5 g e o número); "Como queres cozinhar?" (os cartões do formulário, já com o que a pessoa tem, mais "Sem cozinhar"); opcional "Quero usar alimentos que tenho" (o mesmo seletor por grupos, até 6); "Mais opções" com o tempo (o habitual da pessoa) e as doses; estados a gerar / erro / quota esgotada.
9. **Receita:** proteína por dose e quanto cobre da meta da refeição (ou "Pediste X g por dose"), tempo, doses, com que se cozinha, ingredientes, passos, "Pôr no meu dia" (escolhe a refeição; uma dose, sem a despensa e só o que a pessoa pode comer, convertida para porções reais em meias porções — `src/domain/recipe-to-day.ts`), guardar, favorita, partilhar, gerar outra, aviso IA.
10. **Receitas (livro):** duas entradas ("Uma receita" e "O dia todo"); o livro em separadores, Guardadas (estrela de favorita em cada uma, favoritas primeiro, "Só favoritas") e Recentes, com a refeição em cada cartão e filtro por refeição.
10a. **O dia todo** (`/receitas/dia`): as refeições do plano com a meta de cada uma, tempo, doses e eletrodomésticos, quanto da quota de hoje usa; "Gerar o meu dia" → `/receitas/dia/ver`: uma receita por refeição (proteína, tempo, alimentos), o total do dia contra a meta, "Pôr o dia todo no meu dia" e, para as que falharam, "Gerar só esta". O "Hoje" diz o que comer; as Receitas dizem como cozinhar e voltam ao dia com "Pôr no meu dia".
11. **Conta:** "As minhas preferências", exportar, sair, apagar.

Navegação: barra inferior no telemóvel (Hoje, Alimentos, Receitas, Conta; escondida no formulário e em Entrar), superior no desktop. Tom: tu, frases curtas, sempre o próximo passo ("Faltam 23 g. Um skyr resolve.").

## 11. Design

- Direção "cozinha, não ginásio": tons quentes; o número de proteína grande (tabular) como assinatura; barra de progresso grossa.
- Tokens (claro / escuro): `--bg` #FBF8F3 / #12110F · `--surface` #FFFFFF / #1C1A17 · `--text` #1F1B16 / #F3EEE7 · `--text-muted` #6B6258 / #A99F93 · `--primary` #2F6B3A / #6FBF7A · `--accent` #F2B33D / #F5C25E (só fundo) · `--track` #EAE3D8 / #2A2723 · `--danger` #B3261E / #F2B8B5 (só erros técnicos).
- Tipografia: Bricolage Grotesque (títulos, números) + Figtree (texto); escala 12/14/16/20/24/32/56; `tabular-nums`.
- Componentes próprios: `ProteinNumber`, `GoalProgress`, `MealSection`, `PortionStepper`, `FoodCard`, `SuggestionChip`, `RecipeCard`, `FilterChips`, Drawer de adicionar.
- Ilustrações 3D (Fluent Emoji, MIT) nos alimentos, refeições, dietas, alergias, equipamento e passos.
- Movimento com `motion` 14 (`LazyMotion` + `m`, só nas ilhas que o usam): transições de passo, cartões com mola ao escolher, números que contam, barras que enchem, o dia exemplo a entrar no ecrã. 150–350 ms `ease-out`; `MotionConfig reducedMotion="user"` e o CSS global param tudo com `prefers-reduced-motion`.
- A11y: contraste ≥ 4,5:1, alvos ≥ 44 px, foco visível, teclado em tudo, `aria-live` para "Faltam X g", `lang="pt-PT"`.
- **Responsive** (de 320 px a ecrãs de 2560 px): a app ocupa o ecrã até 80rem (90rem a partir de 1536 px), com margens de 16/24/32 px (utilitário `app-container`, igual no cabeçalho, no conteúdo e no rodapé). Telemóvel: uma coluna e barra de navegação em baixo. Desktop: o "Hoje" tem as refeições à esquerda (duas colunas a partir de 1280 px) e o progresso com "Para fechar a meta" numa coluna fixa à direita; a "Nova receita" tem o resumo e o botão fixos ao lado; o detalhe de um alimento tem o "Adicionar ao meu dia" ao lado; o catálogo e as receitas guardadas vão até 4 colunas. O formulário de boas-vindas e os textos legais ficam numa coluna centrada (leitura e foco). Os testes e2e verificam que não há scroll horizontal a 320, 768, 1024, 1440 e 2560 px e que o conteúdo usa a largura.

## 12. Qualidade

| Nível | Ferramenta | Cobre |
| --- | --- | --- |
| Domínio | Vitest + fast-check | 100% de `src/domain` |
| Conteúdo | Vitest | JSON válido, seed = módulo tipado |
| Servidor | Vitest numa D1 local real | ownership com 2 utilizadores, preferências e restrições, quotas por conta, validação de receitas com modelo simulado |
| E2E | Playwright contra `preview`, com a sessão de `scripts/dev-session.ts` | login obrigatório, formulário de boas-vindas, ajustar o dia, gerar receita (mock) |
| Backoffice | Vitest (`admin/test`) | acesso, privacidade dos dados de saúde, CSRF, ações |
| A11y | axe-core + Lighthouse CI | páginas principais, claro e escuro |
| IA | `eval:recipes` | antes de mudar prompt/modelo |

**CI:** PR → lint, typecheck, content:check, testes, build OpenNext, e2e, Lighthouse no Worker local (indicativo: o `wrangler dev` não comprime as respostas). Merge em `main` → deploy staging + migrações → Lighthouse contra o staging (mediana de 5 corridas; bloqueia abaixo de 90 em qualquer categoria). Produção → `workflow_dispatch` manual depois da checklist.

**Performance:** as páginas públicas (landing, `/entrar`, `/alimentos`, detalhe) não carregam a biblioteca de motion; as entradas são CSS (`tw-animate-css`, transições) e o texto principal é visível desde o primeiro paint (é o LCP). A motion fica nas páginas da app (formulário de boas-vindas, receitas).

**Observabilidade:** Workers Logs em JSON (id do pedido, rota, estado, duração, código de erro; sem PII); por geração: modelo, tokens, latência, resultado da validação.

**Contadores do funcionamento** (`ops_counters`, lidos pelo backoffice; padrão do Rejection Quest): gravam-se depois da resposta (`waitUntil`), num só batch com o que estiver pendente. Os que podem vir em rajadas (4xx do login, ações recusadas) ficam em memória por isolate e gravam-se no máximo uma vez por minuto; os outros (receitas, erros do servidor) gravam-se logo, porque com pouco tráfego um isolate pode morrer sem outro pedido que grave o pendente. Sem `ExecutionContext`, gravam logo. Uma falha a gravá-los nunca afeta o pedido (são indicativos). Os nomes são um contrato fixo (`OPS_METRICS` em `src/domain/ops-metrics.ts`):

- `recipes.ok.new` (receita nova do modelo), `recipes.ok.cached` (da cache);
- `recipes.error.<código>`, um por código de `RECIPE_ERROR_CODES` (`invalid_request`, `unknown_food`, `restricted_food`, `needs_cooking`, `unauthorized`, `onboarding_required`, `rate_limited`, `quota_exceeded`, `generation_failed`, `service_unavailable`);
- `recipes.retry` (houve segunda tentativa), `recipes.retry_skipped` (não arrancou por causa do prazo de 14 s), `recipes.slow` (receita nova com mais de 10 s de modelo), `recipes.5xx` (exceção em `POST /api/recipes`; a resposta continua a ser a do Next);
- `auth.400`, `auth.401`, `auth.403`, `auth.404`, `auth.413`, `auth.429` e `auth.5xx` (respostas de `/api/auth/*`, os 5xx e as exceções juntos);
- `actions.rejected` (Server Action devolveu `ok: false`) e `actions.error` (lançou uma exceção), via `countedAction`.

## 13. Backoffice

Worker próprio (`admin/`, `admin.protein-plate.app`), com o mesmo modelo do Rejection Quest: Cloudflare Access + validação do token em cada pedido, lista de emails, HTML gerado no servidor sem JavaScript, leitura só com `SELECT` e três ações com CSRF (terminar sessões, apagar os dados de saúde a pedido, apagar conta). O Painel tem "Precisa de ti", os números principais com a variação face aos 7 dias anteriores, o funcionamento (contadores `ops_counters`, período de 7 a 90 dias), o crescimento (12 a 52 semanas), as pessoas ativas, a retenção por semana de registo e o funil de ativação, todos a partir do que já está na base, sem rastreio novo. Utilizadores com ficha em separadores (sem peso nem alergias), receitas com pesquisa, filtros e ordem, e alimentos com pesquisa e página própria. Detalhes e configuração em `docs/backoffice.md`.
