import { notFound } from "next/navigation";

// Caminhos desconhecidos dentro de um idioma: o not-found do idioma (com o layout da app)
export default function CatchAll() {
  notFound();
}
