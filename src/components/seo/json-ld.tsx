/**
 * Dados estruturados (schema.org em JSON-LD) para o Google. É um bloco de dados, não um script que
 * corre: o CSP não o bloqueia. O `<` escapa-se para o texto nunca fechar a tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
