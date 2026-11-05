# Setup: contas, segredos e ambientes

Tudo o que é preciso criar fora do código. Pode ser feito em paralelo com as primeiras sessões; a Apple deve ficar pronta cedo, porque só se testa em staging.

## Ambientes

| Ambiente | URL | D1 | Login | IA | Deploy |
| --- | --- | --- | --- | --- | --- |
| Local | `localhost:3000` (dev), `localhost:8787` (preview) | D1 local | Google (cliente de desenvolvimento); Apple não funciona em localhost | `AI_MODE=mock` por defeito | — |
| Staging | `staging.` + domínio | `protein-plate-staging` (UE) | Google e Apple | Real, `AI_DAILY_LIMIT` baixo | Automático no merge em `main` |
| Produção | domínio principal | `protein-plate-production` (UE) | Google e Apple | Real | Manual, depois da checklist |

## Checklist

### Cloudflare (conta Workers Paid que já tens)

- [x] Criar as D1 de staging e produção na jurisdição UE (como no Rejection Quest).
- [x] Configurar o binding de rate limiting em `wrangler.jsonc` (staging e produção).
- [x] ~~Widget Turnstile~~: deixou de ser usado com o login obrigatório (3/11/2026). O segredo `TURNSTILE_SECRET_KEY` foi apagado em staging e produção (5/11/2026); falta remover o widget no painel da Cloudflare.
- [x] Domínio `protein-plate.app` (Cloudflare Registrar), ligado ao Worker por custom domain, com `staging.` para staging (`routes` no `wrangler.jsonc`).
- [x] Token de API para o GitHub Actions (`CLOUDFLARE_API_TOKEN`) e `CLOUDFLARE_ACCOUNT_ID`.

### Google

- [x] Cliente OAuth do tipo **Web** ("Protein Plate Web", projeto `protein-plate`) (separado do cliente iOS do Rejection Quest).
- [x] Origens JavaScript (localhost, staging e produção) e redirect URIs: `http://localhost:3000/api/auth/callback/google`, `https://staging.protein-plate.app/api/auth/callback/google`, `https://protein-plate.app/api/auth/callback/google`.
- [x] Ecrã de consentimento com o nome final da app, links de privacidade e termos em `protein-plate.app`, publicado ("In production").
- [ ] Opcional: verificar a marca (Search Console + "Verify branding") para o nome e o logótipo aparecerem no login; remover o domínio autorizado antigo `bernardo-sobral7.workers.dev`.

### Apple (conta de developer que já tens)

- [x] App ID novo com "Sign In with Apple" (a descrição aparece no ecrã de login).
- [x] Services ID novo (este é o `APPLE_CLIENT_ID`: `com.bernardopaulino.proteinplate.web`), associado ao App ID `com.bernardopaulino.proteinplate`.
- [x] Domínios e return URLs: `https://staging.protein-plate.app/api/auth/callback/apple` e `https://protein-plate.app/api/auth/callback/apple`.
- [x] Chave "Sign In with Apple" (.p8, só se descarrega uma vez), Key ID e Team ID.

### Anthropic

- [x] Chave de API para staging e outra para produção (expiram a 03/11/2027). Sem cartão na consola, o gasto fica limitado aos créditos (100 $ promocionais do plano Max, expiram a 28/11/2026); antes disso, comprar créditos ou as receitas param.

### GitHub

- [x] Repositório privado.
- [x] Secrets do Actions: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
- [x] Dependabot ligado.

### INSA

- [ ] Email a tabela.alimentos@insa.min-saude.pt a confirmar os termos de reutilização da TCA numa app web pública (projeto de portefólio, com atribuição).

## Segredos por ambiente (`wrangler secret` / `.dev.vars`)

| Segredo | Notas |
| --- | --- |
| `BETTER_AUTH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Cliente Web |
| `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | Services ID e chave .p8 |
| `ANTHROPIC_API_KEY` | Uma por ambiente |
| `IP_HASH_SECRET` | Chave diária do HMAC derivada deste valor e da data |
| ~~`TURNSTILE_SECRET_KEY`~~ | Já não é usado (login obrigatório desde 3/11/2026); apagar onde existir |

O env é validado com Zod (`src/lib/env.ts`): `BETTER_AUTH_SECRET` e `IP_HASH_SECRET` são obrigatórios (mínimo 32 caracteres), `ANTHROPIC_API_KEY` é obrigatória com `AI_MODE=live`, o Google precisa do par ID/segredo e a Apple dos quatro valores. Se faltar algum, o Worker responde 503 e o `wrangler tail --env <ambiente>` mostra `env_invalid` com os campos.

## Variáveis públicas (`wrangler.jsonc`)

`APP_ENV`, `BETTER_AUTH_URL`, `AI_MODEL` (`claude-haiku-5-5`), `AI_MODE` (`live` ou `mock`), `AI_DAILY_LIMIT`, `QUOTA_USER` (15).

- `FOOD_DATA_VERSION` vem de `content/foods/meta.json` (gerado em `src/content/foods.generated.ts`) e `PROMPT_VERSION` do ficheiro do prompt: ficam junto do que versionam, sem risco de desencontro.
- `BETTER_AUTH_URL` é pública e fica em `vars`.

## Recursos criados

| Recurso | Valor |
| --- | --- |
| D1 staging (UE) | `protein-plate-staging` · `1962d9d9-fd77-40a7-bf7e-8f56124e28cb` |
| D1 produção (UE) | `protein-plate-production` · `562e6646-b033-458b-ae8b-e54952e68a81` |
| Staging | `https://staging.protein-plate.app` |
| Produção | `https://protein-plate.app` |

### Backoffice (Cloudflare Access)

- [ ] Aplicação do Cloudflare Zero Trust Access para `admin.protein-plate.app` e `admin-staging.protein-plate.app` (passo a passo em `docs/backoffice.md`); team domain, AUD e email em `admin/wrangler.jsonc`.

## Lançamento em produção

Estado a 5/11/2026. O deploy é o workflow manual "Deploy produção" (escrever `produção` para confirmar); aplica as migrações, carrega o seed e publica o Worker.

### Bloqueia o lançamento

- [x] Segredos do Worker de produção (5/11/2026): `ANTHROPIC_API_KEY`, `BETTER_AUTH_SECRET` e `IP_HASH_SECRET` (próprios de produção), `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET` e os quatro `APPLE_*` (os mesmos de staging). Os valores só se validam no primeiro deploy: um 503 com `env_invalid` no `wrangler tail --env production` indica o campo.
- [x] Curadoria: os 168 alimentos com valores de referência revistos (`tcaCode: "REF"`, 5/11/2026). O portal da TCA estava em baixo (504); falta associar os códigos dos itens quando voltar.
- [x] Google: origem e redirect URI de produção no cliente OAuth; ecrã de consentimento publicado ("In production").

### Antes ou logo a seguir

- [ ] Créditos da Anthropic: os 100 $ promocionais expiram a 28/11/2026 e não há cartão na consola.
- [ ] Beacon do Cloudflare Web Analytics bloqueado pelo CSP: desligar a injeção automática ou permiti-lo no CSP.
- [ ] Email ao INSA sobre a reutilização da TCA (secção INSA acima).
- [ ] Regra "required reviewer" no ambiente `production` do GitHub (criado na primeira corrida do workflow).
- [ ] Apagar o projeto criado por engano na Vercel e o widget do Turnstile no painel da Cloudflare.
- [ ] Backoffice (secção acima) e deploy do `admin/`.

### Depois do primeiro deploy

- [ ] Checklist manual: login Google e Apple em produção, apagar conta, modo escuro, VoiceOver, rede lenta.
- [ ] GIF do README e secção "Resultados" de `docs/case-study.md`.
