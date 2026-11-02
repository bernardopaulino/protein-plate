import { Bricolage_Grotesque, Figtree } from "next/font/google";

/** Títulos e números (o número de proteína é a assinatura visual). */
export const bricolage = Bricolage_Grotesque({
  subsets: ["latin", "latin-ext"],
  variable: "--font-bricolage",
  display: "optional",
});

/** Texto corrido. */
export const figtree = Figtree({
  subsets: ["latin", "latin-ext"],
  variable: "--font-figtree",
  display: "optional",
});
