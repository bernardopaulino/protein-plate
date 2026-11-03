/**
 * Cabeçalhos de segurança de todas as respostas (secção 9 da especificação). A CSP só abre o
 * próprio domínio e os providers de login. O HSTS é acrescentado pelo Worker, só em HTTPS
 * (worker/index.ts), para o preview em http://localhost continuar a funcionar.
 */
export function securityHeaders(isDev = process.env.NODE_ENV === "development") {
  const csp = [
    "default-src 'self'",
    // O Next injeta scripts inline de hidratação; em desenvolvimento precisa de eval (React Refresh)
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? " ws:" : ""}`,
    "frame-src 'none'",
    "form-action 'self' https://accounts.google.com https://appleid.apple.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join("; ");

  return [
    { key: "Content-Security-Policy", value: csp },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  ];
}
