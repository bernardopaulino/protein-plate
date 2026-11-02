"use client";

import { useEffect, useRef } from "react";
import type { GuestState } from "@/domain/contracts/guest-state";
import { getGuestSnapshot, subscribeGuestState } from "@/lib/guest-store";
import { syncDayAction } from "@/server/actions/account";

const DEBOUNCE_MS = 800;

/** O que vai para a conta: meta, refeições e o dia. Nunca o peso. */
export function toSyncPayload(state: GuestState & { owner: string }) {
  return {
    owner: state.owner,
    profile: {
      dailyTargetG: state.target.grams,
      intensity: state.target.intensity,
      meals: state.meals,
      postWorkoutMeal: state.postWorkoutMeal,
      locale: "pt" as const,
    },
    items: state.plan.items,
  };
}

/**
 * Com conta, o dia continua a viver no browser e sincroniza com a D1 depois de cada mudança
 * (debounce). Montado no layout: funciona em todas as páginas, incluindo as estáticas.
 */
export function AccountSync() {
  const lastSent = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const push = () => {
      const state = getGuestSnapshot();
      if (!state?.owner) return;
      const payload = JSON.stringify(toSyncPayload({ ...state, owner: state.owner }));
      if (payload === lastSent.current) return;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try {
          const result = await syncDayAction(JSON.parse(payload));
          // Sessão terminada noutro sítio: a cópia local deixa de ser de uma conta
          if (!result.ok && result.code === "unauthorized") return;
          lastSent.current = payload;
        } catch {
          // Sem rede: tenta outra vez na próxima mudança
        }
      }, DEBOUNCE_MS);
    };
    const unsubscribe = subscribeGuestState(push);
    return () => {
      unsubscribe();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return null;
}
