/** Bindings do Worker do backoffice (admin/wrangler.jsonc). */
export type AdminBindings = {
  DB: D1Database;
  /** Nome da equipa do Cloudflare Zero Trust: o token vem de https://<equipa>.cloudflareaccess.com. */
  ACCESS_TEAM_DOMAIN: string;
  /** "Application Audience (AUD) Tag" da aplicação do Access (64 caracteres hexadecimais). */
  ACCESS_AUD: string;
  /** Emails autorizados, separados por vírgulas: segunda barreira, além da política do Access. */
  ADMIN_EMAILS: string;
  /** Só na configuração local: entra sem Access, e só em pedidos a localhost. */
  ADMIN_DEV_BYPASS?: string;
  /** O endereço da app, para os links das receitas públicas (/receitas/<id>). */
  APP_URL?: string;
};

export type AdminEnv = {
  Bindings: AdminBindings;
  Variables: {
    /** Quem entrou (o email do token do Access, ou "local" em desenvolvimento). */
    adminEmail: string;
  };
};

/** Uma fonte de dados de uma página: lida, ou falhou (e o resto da página aparece na mesma). */
export type Loaded<T> = { ok: true; value: T } | { ok: false };
