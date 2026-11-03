# Backoffice

Painel só para o dono, para gerir o serviço e dar apoio: as contas, as preferências, as receitas geradas, o custo da IA e o uso do catálogo. Fica na pasta `admin/`, num Worker à parte (`protein-plate-admin`), com a mesma D1 da app:

| Ambiente | Endereço | D1 |
| --- | --- | --- |
| Local | `http://localhost:8789` (`npm run admin:dev`) | `protein-plate-local` (a mesma `.wrangler/state` da app) |
| Staging | `https://admin-staging.protein-plate.app` | `protein-plate-staging` |
| Produção | `https://admin.protein-plate.app` | `protein-plate-production` |

O padrão é o do backoffice do Rejection Quest (`rejection-quest-api/admin`): Hono, HTML gerado no servidor e sem JavaScript, o Cloudflare Access à frente e o token do Access validado de novo no Worker.

## O que mostra

- **Painel** (`/`): utilizadores (total, novos nos últimos 7 e 30 dias, contas novas por semana nas últimas 12 semanas), onboarding feito (número e %), ativos (contas com uma sessão criada nos últimos 7 dias), receitas geradas (hoje, 7 e 30 dias, por dia nos últimos 30), tokens de entrada e de saída e custo estimado por modelo (30 dias e desde o início), receitas guardadas, a distribuição das preferências de quem fez o onboarding (alimentação, refeições por dia, % que treina com pré e pós-treino, tempo para cozinhar e equipamento), os 15 alimentos mais escolhidos e os 15 mais usados nas receitas, e as alergias só agregadas (ver abaixo).
- **Utilizadores** (`/utilizadores`): lista com pesquisa por nome, email ou ID exato, ordem pela data de criação e páginas de 25. A **ficha** (`/utilizadores/:id`) tem o nome, o email, a data de criação, as formas de entrar (Google, Apple), as sessões ativas e a última entrada, o onboarding, a meta diária, as refeições (com o pré e o pós-treino), a alimentação, o equipamento, o tempo para cozinhar, os alimentos de que gosta (pelo nome) e as receitas guardadas (com link para a ficha de cada receita).
- **Receitas** (`/receitas`): as mais recentes primeiro (título, refeição, doses, proteína por dose, modelo, versão do prompt, tokens, quantas pessoas a guardaram e data). A ficha (`/receitas/:id`) tem os ingredientes pelo nome do catálogo, em gramas, os passos e o link para a página pública na app (`APP_URL/receitas/<id>`).
- **Alimentos** (`/alimentos`): todo o catálogo com quantas pessoas o escolheram no onboarding, em quantos dias guardados aparece e quantas receitas o usam; ordena por cada coluna e filtra pela categoria. Os ids que já não estão no catálogo aparecem no fim, marcados.
- **Ações** (as únicas escritas): terminar todas as sessões de uma conta e apagar uma conta (ver "Ações").

Os nomes dos alimentos vêm de `src/content/foods.generated.ts` (o mesmo catálogo da app, no momento do deploy do backoffice). O custo usa os preços de `admin/src/pricing.ts` (Claude Haiku 5.5: $0,10 por 1M de tokens de entrada e $0,50 por 1M de saída); um modelo sem preço (o `mock` do local) aparece como "sem preço". Muda o preço aí quando mudares o modelo ou a Anthropic mudar a tabela.

## O que nunca mostra, e porquê

A base legal é gerir o serviço e dar apoio a quem o pede. Por isso o backoffice mostra só o que serve isso, e os dados de saúde ficam de fora:

- **Peso e alergias nunca por pessoa.** São dados de saúde (art. 9.º do RGPD), guardados só com o consentimento explícito. Nenhuma consulta da ficha pede as colunas `weight_kg` nem `allergies` (o que não se lê não pode aparecer); a ficha diz só "Dados de saúde guardados com consentimento em <data>" ou "Sem dados de saúde". Os testes confirmam que o peso e as alergias não aparecem no HTML e que as consultas não pedem essas colunas nem fazem `select *`.
- **A intensidade do treino também não aparece na ficha**: a meta é o peso vezes 1,6 a 2,2 g por kg, conforme a intensidade, por isso as duas juntas davam o peso.
- **Alergias só agregadas, e só a partir de 5 pessoas.** No Painel, quantas pessoas têm cada alergénio (só perfis com o consentimento de dados de saúde); abaixo de 5, incluindo o zero, aparece "<5". O total de pessoas com alguma alergia segue a mesma regra.
- **Sem IP nem dispositivo**: as sessões não os guardam e a ficha não os pede.
- **As receitas não têm dono**: a lista de receitas não diz quem as pediu (só quantas pessoas guardaram cada uma).
- **Registos**: sem registos automáticos de pedidos (`invocation_logs: false`); as ações registam só o nome da ação (`end_sessions`, `delete_account`), nunca o ID, o email nem o corpo do pedido, e os erros só o nome do erro.

Sugestão para a política de privacidade (`/privacidade`): dizer que o responsável vê os dados da conta e as preferências para gerir o serviço e dar apoio, e que os dados de saúde nunca aparecem por pessoa.

## Segurança

- **Cloudflare Access** à frente dos dois domínios, e o Worker valida também o token do Access em cada pedido (`Cf-Access-Jwt-Assertion`: RS256 com as chaves públicas da equipa, `aud`, `iss` e validade; `admin/src/access.ts` e `admin/src/require-access.ts`) e exige um email de `ADMIN_EMAILS`. Tudo passa por aqui, incluindo o CSS, o ícone e as páginas de erro.
- **Fecha por defeito**: sem `ACCESS_TEAM_DOMAIN`, `ACCESS_AUD` e `ADMIN_EMAILS` válidos, responde 503 a tudo. A entrada sem Access (`ADMIN_DEV_BYPASS=1`) só existe na configuração local e só para pedidos a `localhost`/`127.0.0.1`; em staging e produção é `"0"`.
- **Cabeçalhos**: CSP sem scripts (`default-src 'none'`, estilos e imagens só do próprio Worker, `form-action 'self'`, `frame-ancestors 'none'`), `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, `Referrer-Policy: same-origin`, `X-Frame-Options: DENY`.
- **Só leitura**: as páginas leem por uma D1 que só aceita um `SELECT` por instrução (sem `WITH`, sem `;`, sem `exec`, `dump` nem `withSession`; `admin/src/db.ts`). As ações usam a D1 do binding, só nos POST (`admin/src/actions.ts`).
- **Ações com CSRF**, como no Rejection Quest (`admin/src/csrf.ts`): token aleatório no formulário igual ao do cookie (`__Host-pp-admin-csrf` em HTTPS, Secure, HttpOnly, SameSite=Strict; em `http://localhost` sem o prefixo), origem do próprio backoffice, `Sec-Fetch-Site` same-origin e corpo até 4 KB. Apagar uma conta pede uma página de confirmação onde se escreve o email da conta.
- **Tudo o que vem da base é escapado** (nomes, emails, títulos e passos gerados pela IA).

## Ações

- **Terminar as sessões**: apaga todas as sessões da conta; no próximo pedido, a app pede para entrar de novo. Os dados ficam.
- **Apagar a conta**: os mesmos passos do "Apagar conta" da app (o `deleteUser` do Better Auth): as sessões, as ligações ao Google e à Apple e a conta, num só batch; o perfil, os dias, os itens dos dias e as receitas guardadas saem em cascata pelas chaves estrangeiras. Ficam:
  - as receitas geradas (não têm dono);
  - os contadores das quotas (HMAC com `IP_HASH_SECRET`, que o backoffice não tem e que não se ligam à pessoa; o cron apaga-os em 2 dias);
  - numa conta da Apple, a ligação ao Apple ID: a revogação precisa do token cifrado com o segredo do Better Auth, por isso só a app a faz (a pessoa pode tirá-la nas definições do iPhone);
  - as cópias do Time Travel da D1 (expiram em até 30 dias).

## Correr em local

O backoffice local usa a mesma D1 local da app (`.wrangler/state` na raiz do repo), por isso corre-se sempre a partir da raiz:

```bash
npm run db:migrate:local      # se a base local ainda não tiver as migrações
npm run dev                   # (opcional) a app, para criar contas e receitas
npm run admin:dev             # o backoffice em http://localhost:8789, sem Access
```

Em local entra sem login ("Local (sem Access)"), só em `localhost`. Outros comandos:

| Comando | O que faz |
| --- | --- |
| `npm run admin:test` | Testes no runtime dos Workers (`@cloudflare/vitest-plugin`), cada ficheiro com uma D1 real e as migrações da app |
| `npm run admin:typecheck` | Tipos do backoffice (`admin/tsconfig.json`, à parte do da app) |
| `npm run admin:types` | Gera `admin/cloudflare-env.d.ts` a partir de `admin/wrangler.jsonc` |
| `npm run admin:deploy:staging` / `admin:deploy:production` | Deploy, sempre com ambiente explícito |

A CI corre o `admin:typecheck`, o `admin:test` e um `wrangler deploy --dry-run` do backoffice.

## Configurar o Cloudflare Access (passo a passo)

Enquanto isto não estiver feito, o backoffice publicado responde 503 a tudo. Faz-se uma vez, no painel da Cloudflare da conta onde estão os Workers (os nomes dos menus do Zero Trust mudam de vez em quando; os passos são os mesmos):

1. **Equipa do Zero Trust.** Em [dash.cloudflare.com](https://dash.cloudflare.com), abre **Zero Trust**. Se a conta ainda não tiver uma equipa, escolhe o nome da equipa (fica `<equipa>.cloudflareaccess.com`) e o plano **Free** (até 50 utilizadores, sem custo). Se já tiveres uma (por exemplo, a do Rejection Quest, na mesma conta), usa essa.
2. **Forma de entrar.** Em **Settings → Authentication → Login methods**, confirma que o **One-time PIN** (código por email) está ativo. Chega para uma só pessoa.
3. **A aplicação.** Em **Access → Applications → Add an application → Self-hosted**:
   - **Application name**: `Protein Plate Backoffice`;
   - **Session duration**: 24 horas (ou menos);
   - **Public hostnames**: adiciona dois, ambos no domínio `protein-plate.app`, com os subdomínios `admin` e `admin-staging` (caminho vazio);
   - deixa o resto como está.
4. **A política.** Na mesma aplicação, **Add a policy**:
   - **Policy name**: `Só o dono`; **Action**: `Allow`;
   - **Include → Emails**: `bernardo.sobral7@gmail.com`;
   - guarda a política e a aplicação.
5. **Copiar os valores para `admin/wrangler.jsonc`** (nenhum é segredo; preenche-os em `env.staging.vars` e em `env.production.vars`):
   - `ACCESS_TEAM_DOMAIN`: só o nome da equipa, sem `.cloudflareaccess.com` (está em **Zero Trust → Settings → Team name and domain**);
   - `ACCESS_AUD`: a **Application Audience (AUD) Tag** da aplicação (em **Access → Applications → Protein Plate Backoffice**, no resumo da aplicação ou em **Configure → Basic information**; 64 caracteres hexadecimais). Com uma só aplicação para os dois domínios, é a mesma nos dois ambientes;
   - `ADMIN_EMAILS`: `bernardo.sobral7@gmail.com` (vários emails separados por vírgulas; a política do Access deve ter os mesmos).
6. **Deploy** (com `npx wrangler login` feito, ou `CLOUDFLARE_API_TOKEN` com permissão de Workers e D1):

   ```bash
   npm run admin:deploy:staging
   ```

   O primeiro deploy cria o domínio próprio `admin-staging.protein-plate.app` (o `custom_domain` das `routes`). Abre-o numa janela privada: tem de aparecer o ecrã do Access a pedir o email e, depois do código, o Painel com "Entraste como bernardo.sobral7@gmail.com". Sem o Access (por exemplo, `curl -I https://admin-staging.protein-plate.app`) a resposta tem de ser um redirecionamento para `<equipa>.cloudflareaccess.com`.
7. **Produção**, depois de staging estar bem:

   ```bash
   npm run admin:deploy:production
   ```

Se mais tarde recriares a aplicação do Access, a AUD muda: atualiza `ACCESS_AUD` e volta a fazer o deploy (até lá, o Worker recusa tudo). Mudar os emails autorizados é mudar a política do Access e `ADMIN_EMAILS`, e fazer deploy.

## Notas

- **Pesquisa**: a D1 recusa um padrão `LIKE` com mais de 50 bytes, por isso o texto procurado fica pelos 48 caracteres (menos com acentos). O `%`, o `_` e o `\` procuram-se como texto.
- **Ativos**: contam as sessões criadas nos últimos 7 dias (uma entrada na app). O cron da app apaga as sessões expiradas.
- **Preferências**: contam só as contas com o onboarding feito (antes dele o perfil tem os valores por omissão). Os alimentos escolhidos contam todos os perfis.
- **Tempo e datas** sempre em UTC; semanas de segunda a domingo.
