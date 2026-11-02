import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Protein Plate",
    short_name: "Protein Plate",
    description: "Proteína sem dieta: a tua meta com comida de verdade.",
    lang: "pt-PT",
    start_url: "/o-meu-dia",
    scope: "/",
    display: "standalone",
    background_color: "#fbf8f3",
    theme_color: "#2f6b3a",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
