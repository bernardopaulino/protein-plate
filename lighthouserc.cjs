// Lighthouse CI: mínimo de 90 nas quatro categorias em mobile (secção 12).
// Por defeito corre contra o Worker local (indicativo: o `wrangler dev` não comprime as respostas e
// o HTML do catálogo pesa ~220 KB em vez de ~20 KB); a medida que conta é contra o staging, depois do
// deploy: LHCI_BASE_URL=https://staging.protein-plate.app LHCI_RUNS=5 (mediana de 5 corridas).
// Só as páginas públicas: desde o login obrigatório, as da app redirecionam para /entrar.
const base = (process.env.LHCI_BASE_URL ?? "http://localhost:8787").replace(/\/$/, "");
const runs = Number(process.env.LHCI_RUNS ?? 1);

module.exports = {
  ci: {
    collect: {
      url: ["/", "/entrar", "/alimentos", "/alimentos/skyr-natural"].map((path) => base + path),
      numberOfRuns: runs,
      // Por defeito o Lighthouse emula um telemóvel (Moto G Power, rede lenta)
      settings: { chromeFlags: "--headless=new --no-sandbox" },
    },
    assert: {
      // Com várias corridas, conta a mediana (com assertMatrix, a opção vai em cada entrada)
      assertMatrix: [
        {
          matchingUrlPattern: ".*",
          aggregationMethod: "median-run",
          assertions: {
            "categories:performance": ["error", { minScore: 0.9 }],
            "categories:accessibility": ["error", { minScore: 0.9 }],
            "categories:best-practices": ["error", { minScore: 0.9 }],
          },
        },
        // O SEO só conta nas páginas indexáveis (o dia da pessoa tem noindex)
        {
          matchingUrlPattern: "^(?!.*o-meu-dia).*$",
          aggregationMethod: "median-run",
          assertions: { "categories:seo": ["error", { minScore: 0.9 }] },
        },
      ],
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
