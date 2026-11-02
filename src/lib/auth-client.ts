"use client";

import { createAuthClient } from "better-auth/react";

/** Cliente do Better Auth (mesma origem; só os endpoints da allowlist respondem). */
export const authClient = createAuthClient();

export type SocialProvider = "google" | "apple";

export const PROVIDER_NAMES: Record<SocialProvider, string> = {
  google: "Google",
  apple: "Apple",
};
