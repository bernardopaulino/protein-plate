import type { Allergen, Category, Role } from "../../src/domain/food";
import type { Meal } from "../../src/domain/meals";
import type { Diet, Equipment } from "../../src/domain/preferences";

/**
 * Nomes em português para o backoffice, os mesmos que a app mostra (tipados pelo domínio: um
 * valor novo em src/domain obriga a nomeá-lo aqui).
 */

export const MEAL_LABEL: Record<Meal, string> = {
  "pequeno-almoco": "Pequeno-almoço",
  "meio-da-manha": "Meio da manhã",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
  ceia: "Ceia",
};

export const DIET_LABEL: Record<Diet, string> = {
  omnivore: "Come de tudo",
  pescatarian: "Pescetariana",
  vegetarian: "Vegetariana",
  vegan: "Vegana",
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  stove: "Fogão",
  oven: "Forno",
  microwave: "Micro-ondas",
  airfryer: "Air fryer",
  blender: "Liquidificadora",
};

export const ALLERGEN_LABEL: Record<Allergen, string> = {
  milk: "Leite",
  gluten: "Glúten",
  egg: "Ovo",
  fish: "Peixe",
  shellfish: "Marisco",
  "tree-nuts": "Frutos de casca rija",
  peanut: "Amendoim",
  soy: "Soja",
  sesame: "Sésamo",
  lupin: "Tremoço",
  mustard: "Mostarda",
};

export const CATEGORY_LABEL: Record<Category, string> = {
  carne: "Carne",
  peixe: "Peixe",
  marisco: "Marisco",
  conservas: "Conservas",
  ovos: "Ovos",
  laticinios: "Laticínios",
  suplementos: "Suplementos",
  soja: "Soja",
  leguminosas: "Leguminosas",
  cereais: "Cereais",
  tuberculos: "Tubérculos",
  "frutos-secos": "Frutos secos",
  sementes: "Sementes",
  fruta: "Fruta",
  legumes: "Legumes",
  despensa: "Despensa",
};

export const ROLE_LABEL: Record<Role, string> = {
  protein: "Proteína",
  carb: "Hidratos",
  fat: "Gordura",
  vegetable: "Legumes",
  pantry: "Despensa",
};

/** Um valor de uma lista fechada, com o nome; um valor desconhecido aparece tal como está. */
export function labelOf<K extends string>(labels: Record<K, string>, value: string): string {
  return Object.hasOwn(labels, value) ? labels[value as K] : value;
}

const PROVIDERS: Record<string, string> = { google: "Google", apple: "Apple" };

export function providerLabel(id: string): string {
  return PROVIDERS[id] ?? id;
}

export function mealLabel(meal: string): string {
  return labelOf(MEAL_LABEL, meal);
}
