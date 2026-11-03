import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/conta", "/o-meu-dia", "/comecar", "/receitas/nova", "/dev"],
    },
  };
}
