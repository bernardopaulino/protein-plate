# Case study: Protein Plate

> **Protein without the diet.** Uma web app que mostra que atingir a meta diária de proteína é fácil com comida de verdade.
>
> Next.js 16 · TypeScript strict · Cloudflare Workers + D1 · Better Auth · AI SDK · Vitest + fast-check · Playwright

<!-- TODO(lançamento): GIF da primeira utilização (landing → /comecar → /o-meu-dia) e link para produção -->

## O problema

Quem quer comer mais proteína encontra quase sempre o mesmo: apps de dieta que pedem para registar tudo, contar calorias e pesar comida, ou listas de "alimentos proteicos" sem noção de porção. A pergunta real é mais simples: *com a comida que já como, quanto me falta e o que acrescento?*

O Protein Plate responde a isso em menos de dois minutos, sem conta: calculas a meta, vês um dia completo que já lá chega, ajustas porções reais e, se quiseres, geras uma receita com os alimentos escolhidos.

## Princípios que guiaram as decisões

Cada funcionalidade foi avaliada contra sete princípios escritos antes do código (`docs/especificacao.md`, secção 1). Três tiveram mais peso nas decisões técnicas:

- **Números fiáveis.** A proteína vem sempre de uma base curada (TCA do INSA), nunca da IA.
- **Valor antes de registo.** Tudo funciona como convidado; a conta só guarda e sincroniza.
- **Zero culpa.** Abaixo da meta aparece "Faltam 23 g", nunca vermelho nem "falhaste".

## Decisões técnicas

### 1. A IA escreve a receita, a app faz as contas

Um modelo de linguagem não é uma fonte fiável de valores nutricionais. Por isso a IA nunca devolve proteína: devolve uma receita estruturada cujos ingredientes só podem ser ids do catálogo, e a app calcula a proteína a partir da base de dados.

- O schema de saída é **construído por pedido**: `ingredients[].foodId` é um `z.enum` com os alimentos escolhidos e os da despensa. O modelo não consegue inventar ingredientes, porque o schema não o deixa.
- Depois do modelo há uma segunda validação de domínio: todas as fontes de proteína escolhidas estão presentes, as gramas por dose não passam de 3 × a porção por defeito e a proteína por dose (calculada) fica entre 1 e 120 g. Se falhar, há **uma** nova tentativa com o erro descrito; à segunda falha, a pessoa recebe um erro amigável e o pedido não conta para a quota.
- O pedido só tem campos fechados (ids, refeição, tempo, doses), sem texto livre, o que fecha a porta à injeção de prompt.
- **Cache por conteúdo**: a chave é um SHA-256 dos parâmetros normalizados, mais a versão do prompt, o modelo e a versão dos dados dos alimentos. Pedidos iguais não custam nada, e mudar o prompt invalida a cache sem migrações.

### 2. O dia vive no browser

Para não exigir conta, o estado da pessoa (meta, refeições, dia) vive no `localStorage`, numa chave versionada e validada com Zod ao ler. Se a versão for antiga, migra; se for inválida, recomeça sem rebentar. Os componentes subscrevem com `useSyncExternalStore`, o que mantém várias abas sincronizadas pelo evento `storage`.

Com conta, a mesma cópia local ganha um `owner` e um `AccountSync` envia-a para a D1 por Server Action, com debounce. O servidor ignora o `owner` para autorizar (usa sempre o utilizador da sessão) e recusa a sincronização se não coincidirem. Ao sair da conta, a cópia local é apagada, a pensar em aparelhos partilhados.

A importação convidado → conta é **idempotente** (`importId`): um duplo clique ou uma rede instável não criam dias duplicados.

### 3. O peso nunca sai do browser

A meta calcula-se a partir do peso, mas o servidor só guarda a meta em gramas. Os schemas das Server Actions são `strict`, por isso um campo a mais, como o peso, é recusado em vez de ignorado. Há testes que o garantem.

### 4. Domínio puro, testado por propriedades

As regras (meta, refeições, dia exemplo, "fechar a meta") estão em `src/domain`, sem I/O, com 100% de cobertura. A regra mais delicada é o **dia exemplo determinístico**: para qualquer meta de 80 a 250 g e qualquer uma das 57 combinações de refeições, o total tem de ficar entre 100% e 110%. Em vez de escolher casos à mão, um teste **property-based** (fast-check) percorre o espaço todo.

### 5. Next.js 16 em Cloudflare Workers

O deploy é feito com `@opennextjs/cloudflare` sobre D1 na jurisdição UE. Algumas consequências:

- **Português sem prefixo e sem middleware.** O proxy do Next 16 corre em Node, que nos Workers ainda é experimental. As rotas são reescritas para `/pt/...` no `next.config.ts` com uma lista explícita de rotas, porque o routing do OpenNext não aceita lookaheads (descobri-o com um bug, corrigido em `b49323c`).
- **Um Worker próprio** à frente do OpenNext valida o ambiente com Zod antes de servir qualquer pedido (sem segredos válidos, devolve 503 e regista só os *nomes* das variáveis em falta), acrescenta HSTS e cache pública às receitas e corre o cron horário de limpeza.
- **Cliente Drizzle por pedido**, criado a partir do binding, e nunca global.
- Os testes de integração correm numa **D1 local real**, com dois utilizadores por rota, para apanhar falhas de ownership.

### 6. Privacidade por construção

- Sem dados pessoais nos registos. Para as quotas de convidado, o IP só existe como **HMAC com uma chave diária** derivada de um segredo e da data: dá para contar pedidos de hoje, mas não para seguir alguém de um dia para o outro.
- As sessões não guardam IP nem user agent. Os tokens OAuth são descartados, exceto o refresh token da Apple (cifrado), que é preciso para revogar o acesso ao apagar a conta.
- Exportar os dados (JSON) e apagar a conta fazem parte da app, e apagar exige login recente.

## Qualidade

| Área | Como |
| --- | --- |
| Domínio | Vitest com 100% de cobertura em `src/domain`; fast-check para o dia exemplo |
| Integração | Server Actions e `/api/recipes` contra uma D1 local, com dois utilizadores |
| E2E | Playwright em mobile e desktop: primeira utilização, ajustar o dia, gerar receita (modelo simulado) |
| Acessibilidade | axe-core nas páginas principais em claro e escuro; anúncios `aria-live` no "Faltam X g"; `prefers-reduced-motion` |
| IA | `eval:recipes`: 20 combinações fixas contra o modelo real (validade, ingredientes fora da lista, proteína plausível, latência) |
| Performance | Lighthouse CI em mobile |
| Segurança | CSP restrita, allowlist dos endpoints do Better Auth, Turnstile, rate limiting e quotas |

## O que aprendi

- **Validar à entrada não chega quando a saída vem de um modelo.** O schema do modelo restringe a *forma*, mas só uma segunda validação de domínio garante que a receita faz sentido (todas as proteínas presentes, doses plausíveis).
- **O custo do Zod no cliente.** O estado de convidado é validado no browser e isso trazia o Zod clássico (cerca de 32 KB gzip) para as páginas com o dia. Os contratos que chegam ao cliente passaram para `zod/mini`, cuja API funcional só leva para o bundle as verificações usadas (−14 KB gzip). Os contratos só do servidor continuam no Zod clássico. No mesmo espírito, as fontes passaram a carregar só o subset `latin` (que já cobre o português), em vez de pré-carregar também o `latin-ext`.
- **O runtime manda na arquitetura.** Escolher Workers em vez de um servidor Node teve consequências nas rotas (sem middleware), na base de dados (cliente por pedido) e nos testes (D1 local real em vez de mocks).

## Resultados

<!-- TODO(lançamento): preencher com os números de produção -->

| Métrica | Meta | Resultado |
| --- | --- | --- |
| Tempo até um dia que atinge a meta, sem conta | < 2 min | *por medir* |
| Lighthouse mobile (4 categorias, staging) | ≥ 90 | Performance 90–91 (89 em `/o-meu-dia`), acessibilidade 100, boas práticas 100, SEO 100 nas páginas indexáveis |
| Receitas válidas no `eval:recipes` (20 casos, Haiku 5.5) | ≥ 18/20 | 20/20 (19 à primeira; 1 precisou da segunda tentativa) |
| Latência de uma receita nova | < 15 s | mediana 6,9 s; a única com segunda tentativa levou 25,7 s |

## Próximos passos

- v1.1: inglês (`/en`, a estrutura já existe), preferências alimentares e vários "dias tipo".
- v2: app Expo sobre o mesmo backend (`/api/recipes` já é um contrato público), lista de compras e custo por grama de proteína.
