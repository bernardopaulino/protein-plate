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
const NOT_LOCALIZED = "(?!en(?:/|$)|pt(?:/|$)|api(?:/|$)|_next/|.*\.[a-zA-Z0-9]+$)";

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
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/", destination: "/pt" },
        { source: `/:path(${NOT_LOCALIZED}.+)`, destination: "/pt/:path" },
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
