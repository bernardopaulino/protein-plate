"use client";

import { useTranslations } from "next-intl";
import { UI_IMAGES } from "@/content/food-images.generated";
import { EQUIPMENT, type Equipment } from "@/domain/preferences";
import { OptionCard } from "@/features/onboarding/ui";

/** O mesmo conjunto de equipamento, sem olhar à ordem. */
export function sameEquipment(a: readonly Equipment[], b: readonly Equipment[]): boolean {
  return a.length === b.length && a.every((e) => b.includes(e));
}

/**
 * Os eletrodomésticos para uma receita (ou para o dia): os mesmos cartões do formulário de boas-
 * vindas, mais "Sem cozinhar" (lista vazia). Começa com o que a pessoa tem em casa; escolher "Sem
 * cozinhar" desliga os outros e escolher um eletrodoméstico desliga o "Sem cozinhar".
 */
export function EquipmentPicker({
  value,
  onChange,
  profileEquipment,
  className,
}: {
  value: readonly Equipment[];
  onChange: (next: Equipment[]) => void;
  profileEquipment: readonly Equipment[];
  className?: string;
}) {
  const t = useTranslations("recipes.form");
  const tk = useTranslations("onboarding.kitchen");
  const noCooking = value.length === 0;
  const toggle = (item: Equipment) => {
    const on = value.includes(item);
    onChange(
      on
        ? value.filter((e) => e !== item)
        : EQUIPMENT.filter((e) => e === item || value.includes(e)),
    );
  };

  return (
    <div className={className}>
      <div
        role="group"
        aria-label={t("equipment")}
        className="grid grid-cols-2 gap-3 lg:grid-cols-3"
      >
        {EQUIPMENT.map((item) => (
          <OptionCard
            key={item}
            role="checkbox"
            compact
            selected={value.includes(item)}
            onSelect={() => toggle(item)}
            image={UI_IMAGES[`equipment:${item}`]}
            title={tk(`equipmentNames.${item}`)}
          />
        ))}
        <OptionCard
          role="checkbox"
          compact
          selected={noCooking}
          onSelect={() => onChange(noCooking ? [...profileEquipment] : [])}
          image={UI_IMAGES["group:salada"]}
          title={t("noCooking")}
        />
      </div>
      {noCooking ? <p className="mt-2 text-sm text-muted">{t("noCookingHint")}</p> : null}
      {!sameEquipment(value, profileEquipment) ? (
        <button
          type="button"
          onClick={() => onChange([...profileEquipment])}
          className="mt-2 min-h-11 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t("equipmentReset")}
        </button>
      ) : null}
    </div>
  );
}

/** "Fogão, Micro-ondas" ou "Sem cozinhar" (resumos). */
export function EquipmentSummary({ value }: { value: readonly Equipment[] }) {
  const t = useTranslations("recipes.form");
  const tk = useTranslations("onboarding.kitchen");
  if (value.length === 0) return <>{t("noCooking")}</>;
  return (
    <>
      {EQUIPMENT.filter((e) => value.includes(e))
        .map((e) => tk(`equipmentNames.${e}`))
        .join(", ")}
    </>
  );
}
