import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
import { securityHeaders } from "./src/lib/security-headers";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/**
 * Português sem prefixo, sem middleware: os pedidos sem idioma são reescritos para /pt/... (o
 * segmento [locale] das rotas) e /pt/... redireciona para o endereço sem prefixo. O inglês vive
 * em /en (v1.1). O proxy do Next 16 corre em Node, que no Workers ainda é experimental.
 */
/**
 * Rotas da app (sem prefixo de idioma). Lista explícita: o routing do OpenNext não aceita
 * lookaheads nos rewrites.
 */
const APP_ROUTES = [
  "entrar",
  "comecar",
  "alimentos",
  "o-meu-dia",
  "receitas",
  "conta",
  "privacidade",
  "termos",
  "dev",
] as const;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Sem otimização de imagens no Worker (não há binding de imagens; os ícones são SVG)
  images: { unoptimized: true },
  typedRoutes: false,
  async redirects() {
    return [
      { source: "/pt", destination: "/", permanent: true },
      { source: "/pt/:path*", destination: "/:path*", permanent: true },
      // Desde o login obrigatório, criar conta e entrar são a mesma página
      { source: "/conta/criar", destination: "/entrar", permanent: true },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/pt" },
        ...APP_ROUTES.flatMap((route) => [
          { source: `/${route}`, destination: `/pt/${route}` },
          { source: `/${route}/:path*`, destination: `/pt/${route}/:path*` },
        ]),
      ],
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders() }];
  },
};

export default withNextIntl(nextConfig);

initOpenNextCloudflareForDev();
