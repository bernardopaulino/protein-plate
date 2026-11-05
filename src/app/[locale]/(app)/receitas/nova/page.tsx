import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { EQUIPMENT, type Equipment } from "@/domain/preferences";
import { RecipeForm } from "@/features/recipes/recipe-form";
import type { Locale } from "@/i18n/routing";
import { requireProfile } from "@/server/auth/guard";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "recipes.form" });
  return { title: t("title"), robots: { index: false } };
}

export default async function NewRecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const query = await searchParams;
  const t = await getTranslations("recipes");
  const td = await getTranslations("disclaimer");
  const { profile } = await requireProfile(locale, "/receitas/nova");

  const meal = typeof query.refeicao === "string" ? query.refeicao : null;
  const foods =
    typeof query.alimentos === "string"
      ? query.alimentos.split(",").filter(Boolean).slice(0, 12)
      : [];
  // "Gerar outra" repete a proteína e o equipamento escolhidos ("nenhum" = sem cozinhar)
  const target = Number(query.proteina);
  const equipment =
    typeof query.equipamento === "string"
      ? query.equipamento === "nenhum"
        ? []
        : query.equipamento
            .split(",")
            .filter((e): e is Equipment => (EQUIPMENT as readonly string[]).includes(e))
      : null;

  return (
    <div className="pb-8">
      <h1 className="text-2xl font-extrabold">{t("form.title")}</h1>
      <p className="mt-2 text-muted">{t("lead")}</p>
      <div className="mt-6">
        <RecipeForm
          profile={{
            dailyTargetG: profile.dailyTargetG,
            meals: profile.meals,
            preWorkoutMeal: profile.preWorkoutMeal,
            postWorkoutMeal: profile.postWorkoutMeal,
            diet: profile.diet,
            allergies: profile.allergies,
            likedFoods: profile.likedFoods,
            cookMinutes: profile.cookMinutes,
            equipment: profile.equipment,
          }}
          initialMeal={meal}
          initialFoods={foods}
          initialMinutes={Number(query.tempo) || null}
          initialServings={Number(query.doses) || 1}
          initialTarget={Number.isInteger(target) && target > 0 ? target : null}
          initialEquipment={
            equipment && (equipment.length > 0 || query.equipamento === "nenhum") ? equipment : null
          }
          variant={Number(query.variante) || 1}
        />
      </div>
      <p className="mt-6 text-sm text-muted">{td("recipe")}</p>
    </div>
  );
}
