import Link from "next/link";
import "./globals.css";
import { bricolage, figtree } from "./fonts";

// Caminhos fora das rotas da app (sem idioma): página simples, com o seu próprio <html>, nos dois
// idiomas (não se sabe qual a pessoa usa)
export default function GlobalNotFound() {
  return (
    <html lang="pt-PT" className={`${bricolage.variable} ${figtree.variable}`}>
      <body className="grid min-h-dvh place-items-center p-6 text-center">
        <title>Página não encontrada · Protein Plate</title>
        <div>
          <Link
            href="/"
            className="mx-auto mb-8 inline-flex items-center gap-2 font-display text-lg font-bold"
          >
            <svg aria-hidden viewBox="0 0 32 32" className="size-8">
              <circle cx="16" cy="16" r="15" fill="var(--primary)" />
              <circle cx="16" cy="16" r="9.5" fill="var(--bg)" />
              <path d="M16 6.5a9.5 9.5 0 0 1 9.5 9.5H16z" fill="var(--accent)" />
            </svg>
            Protein Plate
          </Link>
          <h1 className="text-2xl font-bold">Esta página não existe</h1>
          <p className="mt-2 text-muted">Talvez o link esteja errado.</p>
          <p lang="en" className="mt-4 text-muted">
            This page doesn&apos;t exist. Maybe the link is wrong.
          </p>
          <p className="mt-6 flex justify-center gap-6">
            <Link href="/" className="font-semibold text-primary underline">
              Ir para o início
            </Link>
            <Link href="/en" lang="en" className="font-semibold text-primary underline">
              Go to the home page
            </Link>
          </p>
        </div>
      </body>
    </html>
  );
}
