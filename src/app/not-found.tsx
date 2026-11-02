import Link from "next/link";
import "./globals.css";

// Caminhos fora das rotas da app (sem idioma): página simples, com o seu próprio <html>
export default function GlobalNotFound() {
  return (
    <html lang="pt-PT">
      <body className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Esta página não existe</h1>
          <p className="mt-2 text-muted">Talvez o link esteja errado.</p>
          <Link href="/" className="mt-6 inline-block font-semibold text-primary underline">
            Ir para o início
          </Link>
        </div>
      </body>
    </html>
  );
}
