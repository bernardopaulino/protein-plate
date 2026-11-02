import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { cache } from "react";
import { getDb } from "../db/client";
import { getEnv } from "../env";
import { createAuth } from "./auth";

/** Better Auth do pedido atual. */
export const getAuth = cache(async () => {
  const { ctx } = getCloudflareContext();
  return createAuth(getEnv(), getDb(), { waitUntil: (p) => ctx.waitUntil(p) });
});

export interface SessionUser {
  id: string;
  name: string;
  email: string;
}

export interface AppSession {
  user: SessionUser;
  /** Quando a sessão foi criada (epoch ms): apagar a conta exige um login recente. */
  createdAt: number;
}

/** Sessão do pedido (ou null). O user ID vem sempre daqui, nunca do cliente. */
export const getSession = cache(async (): Promise<AppSession | null> => {
  const auth = await getAuth();
  const result = await auth.api.getSession({ headers: await headers() });
  if (!result) return null;
  return {
    user: { id: result.user.id, name: result.user.name, email: result.user.email },
    createdAt: new Date(result.session.createdAt).getTime(),
  };
});
