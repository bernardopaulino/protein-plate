"use client";

import { Bookmark, BookmarkCheck, RefreshCw, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { recipeSavedStateAction, setRecipeSavedAction } from "@/server/actions/account";

/**
 * Guardar, partilhar e gerar outra. A página da receita é igual para toda a gente (cache pública);
 * o estado "guardada" vem depois, do browser.
 */
export function RecipeActions({
  recipeId,
  title,
  anotherHref,
}: {
  recipeId: string;
  title: string;
  anotherHref: { pathname: string; query: Record<string, string> } | null;
}) {
  const t = useTranslations("recipes.detail");
  const [state, setState] = useState<{ signedIn: boolean; saved: boolean } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    recipeSavedStateAction({ recipeId })
      .then((r) => active && r.ok && setState(r.data))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [recipeId]);

  const toggle = async () => {
    if (!state?.signedIn) return;
    const next = !state.saved;
    setState({ ...state, saved: next });
    const result = await setRecipeSavedAction({ recipeId, saved: next });
    if (result.ok) setState({ signedIn: true, saved: result.data });
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // cancelado: copia o link
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage(t("copied"));
    } catch {
      setMessage(url);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {state?.signedIn ? (
        <Button
          variant={state.saved ? "soft" : "primary"}
          onClick={toggle}
          aria-pressed={state.saved}
        >
          {state.saved ? <BookmarkCheck aria-hidden /> : <Bookmark aria-hidden />}
          {state.saved ? t("saved") : t("save")}
        </Button>
      ) : state ? (
        <Button asChild variant="secondary">
          <Link href="/entrar">
            <Bookmark aria-hidden />
            {t("loginToSave")}
          </Link>
        </Button>
      ) : null}
      <Button variant="secondary" onClick={share}>
        <Share2 aria-hidden />
        {t("share")}
      </Button>
      {anotherHref ? (
        <Button asChild variant="ghost">
          <Link href={anotherHref}>
            <RefreshCw aria-hidden />
            {t("another")}
          </Link>
        </Button>
      ) : null}
      <p aria-live="polite" className="w-full text-sm text-muted">
        {message}
      </p>
    </div>
  );
}
