// Lighthouse CI: mínimo de 90 nas quatro categorias em mobile (secção 12), contra o Worker local
module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:8787/",
        "http://localhost:8787/comecar",
        "http://localhost:8787/alimentos",
        "http://localhost:8787/alimentos/skyr-natural",
        "http://localhost:8787/o-meu-dia",
      ],
      numberOfRuns: 1,
      // Por defeito o Lighthouse emula um telemóvel (Moto G Power, rede lenta)
      settings: { chromeFlags: "--headless=new --no-sandbox" },
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: ".*",
          assertions: {
            "categories:performance": ["error", { minScore: 0.9 }],
            "categories:accessibility": ["error", { minScore: 0.9 }],
            "categories:best-practices": ["error", { minScore: 0.9 }],
          },
        },
        // O SEO só conta nas páginas indexáveis (o dia da pessoa tem noindex)
        {
          matchingUrlPattern: "^(?!.*o-meu-dia).*$",
          assertions: { "categories:seo": ["error", { minScore: 0.9 }] },
        },
      ],
    },
    upload: { target: "filesystem", outputDir: ".lighthouseci" },
  },
};
