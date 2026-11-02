import "server-only";
import type { SocialProvider } from "@/lib/auth-client";
import { getEnv } from "../env";

/** Providers configurados neste ambiente (a Apple não funciona em localhost). */
export function availableProviders(): SocialProvider[] {
  const env = getEnv();
  const providers: SocialProvider[] = [];
  if (env.APPLE_CLIENT_ID && env.APPLE_PRIVATE_KEY) providers.push("apple");
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) providers.push("google");
  return providers;
}
