import type { ReactNode } from "react";
import "./globals.css";

// O <html> fica em app/[locale]/layout.tsx (precisa do idioma)
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
