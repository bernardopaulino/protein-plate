"use client";

import { useState } from "react";
import { FilterChips, SuggestionChip } from "@/components/protein/chips";
import { FoodCard } from "@/components/protein/food-card";
import { GoalProgress } from "@/components/protein/goal-progress";
import { MealSection } from "@/components/protein/meal-section";
import { PortionStepper } from "@/components/protein/portion-stepper";
import { ProteinNumber } from "@/components/protein/protein-number";
import { RecipeCard } from "@/components/protein/recipe-card";
import { Button } from "@/components/ui/button";

/** Todos os componentes base, para rever estados de foco, teclado e os dois temas. */
export function UiShowcase() {
  const [count, setCount] = useState(1.5);
  const [chips, setChips] = useState<string[]>(["lanche"]);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline gap-4">
        <ProteinNumber value={7.5} size="sm" />
        <ProteinNumber value={23} size="md" />
        <ProteinNumber value={46} size="lg" />
        <ProteinNumber value={137} size="xl" />
        <ProteinNumber value={160} size="hero" className="text-primary" />
      </div>
      <GoalProgress total={137} target={160} />
      <GoalProgress total={163} target={160} />
      <MealSection title="Lanche" postWorkoutLabel="Pós-treino" total={23} targetLabel="≈ 23 g">
        <div className="flex items-center justify-between">
          <span>Skyr natural</span>
          <PortionStepper
            count={count}
            onChange={setCount}
            onRemove={() => setCount(0.5)}
            decreaseLabel="Menos meia porção"
            increaseLabel="Mais meia porção"
            removeLabel="Tirar"
          />
        </div>
      </MealSection>
      <FoodCard
        name="Atum em lata ao natural"
        portionLabel="1 lata (escorrida)"
        protein={15}
        meta="Conservas · Sem preparação"
        onAdd={() => {}}
        addLabel="Adicionar atum"
      />
      <SuggestionChip
        protein={16.5}
        title="Skyr natural"
        detail="1 × 1 iogurte · Lanche"
        onSelect={() => {}}
        actionLabel="Adicionar"
      />
      <FilterChips
        label="Refeição"
        options={[
          { value: "almoco", label: "Almoço" },
          { value: "lanche", label: "Lanche" },
          { value: "jantar", label: "Jantar" },
        ]}
        selected={chips}
        onChange={setChips}
        multiple
      />
      <RecipeCard
        title="Salada de grão com atum"
        summary="Rápida, fresca e com 35 g de proteína por dose."
        proteinPerServing={35}
        perServingLabel="por dose"
        minutesLabel="10 min"
        href="#"
        renderLink={({ href, className, children }) => (
          <a href={href} className={className}>
            {children}
          </a>
        )}
      />
      <div className="flex flex-wrap gap-2">
        <Button>Principal</Button>
        <Button variant="secondary">Secundário</Button>
        <Button variant="soft">Suave</Button>
        <Button variant="ghost">Fantasma</Button>
        <Button disabled>Desligado</Button>
      </div>
    </div>
  );
}
