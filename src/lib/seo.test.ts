import { describe, expect, it } from "vitest";
import { absoluteUrl, alternatesFor, localizedPath, pageMetadata } from "./seo";

describe("SEO: endereços por idioma", () => {
  it("o português sem prefixo, o inglês em /en; a página inicial sem barra no fim", () => {
    expect(localizedPath("/", "pt")).toBe("/");
    expect(localizedPath("/", "en")).toBe("/en");
    expect(localizedPath("/alimentos/ovo", "en")).toBe("/en/alimentos/ovo");
    expect(absoluteUrl("/", "pt")).toBe("https://protein-plate.app");
    expect(absoluteUrl("/alimentos", "en")).toBe("https://protein-plate.app/en/alimentos");
  });

  it("hreflang: cada idioma e o x-default (português); o canonical é o da própria página", () => {
    expect(alternatesFor("/alimentos/ovo", "en")).toEqual({
      canonical: "https://protein-plate.app/en/alimentos/ovo",
      languages: {
        "pt-PT": "https://protein-plate.app/alimentos/ovo",
        en: "https://protein-plate.app/en/alimentos/ovo",
        "x-default": "https://protein-plate.app/alimentos/ovo",
      },
    });
  });

  it("Open Graph e Twitter no idioma da página; noindex só quando pedido", () => {
    const meta = pageMetadata({
      locale: "en",
      path: "/",
      title: "T",
      description: "D",
      imageAlt: "A",
      absoluteTitle: true,
    });
    expect(meta.title).toEqual({ absolute: "T" });
    expect(meta.openGraph).toMatchObject({ locale: "en_US", alternateLocale: ["pt_PT"] });
    expect(JSON.stringify(meta.openGraph)).toContain("/og/en.png");
    expect(meta.robots).toBeUndefined();
    expect(
      pageMetadata({
        locale: "pt",
        path: "/x",
        title: "T",
        description: "D",
        imageAlt: "A",
        index: false,
      }).robots,
    ).toEqual({ index: false, follow: true });
  });
});
