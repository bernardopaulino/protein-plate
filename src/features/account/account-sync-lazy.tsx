"use client";

import dynamic from "next/dynamic";

/** O AccountSync (e o Zod do guest store) carrega depois da página, fora do caminho crítico. */
export const AccountSyncLazy = dynamic(() => import("./account-sync").then((m) => m.AccountSync), {
  ssr: false,
});
