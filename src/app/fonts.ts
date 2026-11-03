import { Bricolage_Grotesque, Figtree } from "next/font/google";

/** Títulos e números (o número de proteína é a assinatura visual). */
export const bricolage = Bricolage_Grotesque({
  // Só latin: cobre o português e o inglês (ã, ç, é…); o latin-ext acrescentava 2 fontes pré-carregadas
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "optional",
});

/** Texto corrido. */
export const figtree = Figtree({
  // Só latin: cobre o português e o inglês (ã, ç, é…); o latin-ext acrescentava 2 fontes pré-carregadas
  subsets: ["latin"],
  variable: "--font-figtree",
  display: "optional",
});
