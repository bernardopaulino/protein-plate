"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { RecipeCard } from "@/components/protein/recipe-card";
import { Link } from "@/i18n/navigation";
import { listSavedRecipesAction } from "@/server/actions/account";

type Saved = {
  id: string;
  title: string;
  summary: string;
  proteinPerServingG: number;
  prepMinutes: number;
};

/** Receitas guardadas (só com conta); a página /receitas é estática e isto vem depois. */
export function SavedRecipes() {
  const t = useTranslations("recipes");
  const td = useTranslations("recipes.detail");
  const ta = useTranslations("account");
  const [recipes, setRecipes] = useState<Saved[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    listSavedRecipesAction()
      .then((result) => {
        if (!active) return;
        setSignedIn(result.ok);
        setRecipes(result.ok ? result.data : []);
      })
      .catch(() => active && setSignedIn(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <section aria-labelledby="guardadas" className="mt-10">
      <h2 id="guardadas" className="text-lg font-bold">
        {t("saved")}
      </h2>
      {signedIn === null ? (
        <div aria-hidden className="mt-3 h-24 animate-pulse rounded-card bg-track" />
      ) : !signedIn ? (
        <p className="mt-2 text-muted">
          {t("guestSaved")}{" "}
          <Link
            href="/conta/criar"
            className="font-semibold text-primary underline underline-offset-4"
          >
            {ta("create")}
          </Link>
        </p>
      ) : recipes && recipes.length === 0 ? (
        <p className="mt-2 text-muted">{t("savedEmpty")}</p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {recipes?.map((r) => (
            <li key={r.id}>
              <RecipeCard
                title={r.title}
                summary={r.summary}
                proteinPerServing={r.proteinPerServingG}
                perServingLabel={td("perServing")}
                minutesLabel={td("time", { minutes: r.prepMinutes })}
                href={`/receitas/${r.id}`}
                renderLink={({ href, className, children }) => (
                  <Link href={href} className={className}>
                    {children}
                  </Link>
                )}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
