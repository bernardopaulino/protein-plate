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
- [x] Widget Turnstile "Protein Plate" (Managed, hostname `protein-plate.app`, que cobre o `staging.`); site key no `wrangler.jsonc`, secret key em staging e produção. Local usa as chaves de teste.
- [x] Domínio `protein-plate.app` (Cloudflare Registrar), ligado ao Worker por custom domain, com `staging.` para staging (`routes` no `wrangler.jsonc`).
- [x] Token de API para o GitHub Actions (`CLOUDFLARE_API_TOKEN`) e `CLOUDFLARE_ACCOUNT_ID`.

### Google

- [ ] Cliente OAuth do tipo **Web** (separado do cliente iOS do Rejection Quest).
- [ ] Redirect URIs: `http://localhost:3000/api/auth/callback/google`, `https://staging.protein-plate.app/api/auth/callback/google`, `https://protein-plate.app/api/auth/callback/google`.
- [ ] Ecrã de consentimento com o nome final da app.

### Apple (conta de developer que já tens)

- [x] App ID novo com "Sign In with Apple" (a descrição aparece no ecrã de login).
- [x] Services ID novo (este é o `APPLE_CLIENT_ID`: `com.bernardopaulino.proteinplate.web`), associado ao App ID `com.bernardopaulino.proteinplate`.
- [x] Domínios e return URLs: `https://staging.protein-plate.app/api/auth/callback/apple` e `https://protein-plate.app/api/auth/callback/apple`.
- [x] Chave "Sign In with Apple" (.p8, só se descarrega uma vez), Key ID e Team ID.

### Anthropic

- [ ] Chave de API para staging e outra para produção, com limite de gasto definido na consola.

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
| `TURNSTILE_SECRET_KEY` | |
| `IP_HASH_SECRET` | Chave diária do HMAC derivada deste valor e da data |

## Variáveis públicas (`wrangler.jsonc`)

`APP_ENV`, `BETTER_AUTH_URL`, `AI_MODEL` (`claude-haiku-5-5`), `AI_MODE` (`live` ou `mock`), `AI_DAILY_LIMIT`, `QUOTA_GUEST` (3), `QUOTA_USER` (15), `TURNSTILE_SITE_KEY`.

- `TURNSTILE_SITE_KEY` lê-se em runtime no servidor e passa para o componente (um `NEXT_PUBLIC_*` ficaria fixo no build, igual em todos os ambientes).
- `FOOD_DATA_VERSION` vem de `content/foods/meta.json` (gerado em `src/content/foods.generated.ts`) e `PROMPT_VERSION` do ficheiro do prompt: ficam junto do que versionam, sem risco de desencontro.
- `BETTER_AUTH_URL` é pública e fica em `vars`.

## Recursos criados

| Recurso | Valor |
| --- | --- |
| D1 staging (UE) | `protein-plate-staging` · `1962d9d9-fd77-40a7-bf7e-8f56124e28cb` |
| D1 produção (UE) | `protein-plate-production` · `562e6646-b033-458b-ae8b-e54952e68a81` |
| Staging | `https://staging.protein-plate.app` |
| Produção | `https://protein-plate.app` |
