import type { PreferencesInput } from "@/domain/contracts/profile";
import type { Allergen, FoodIndex } from "@/domain/food";
import {
  DEFAULT_INTENSITY,
  dailyTarget,
  isPlausibleWeight,
  isValidManualTarget,
  weightNeedsConfirmation,
  type Intensity,
} from "@/domain/goal";
import { DEFAULT_COMBINATIONS, normalizeTraining, sortMeals, type Meal } from "@/domain/meals";
import {
  DEFAULT_COOK_MINUTES,
  DEFAULT_DIET,
  DEFAULT_EQUIPMENT,
  MIN_LIKED_PROTEINS,
  cleanLikedFoods,
  proteinCount,
  type Diet,
  type Equipment,
} from "@/domain/preferences";
import type { MaxMinutes } from "@/domain/recipe-options";

/** O perfil que chega ao browser (sem datas internas). */
export interface ClientProfile {
  dailyTargetG: number;
  intensity: Intensity;
  weightKg: number | null;
  manualTarget: boolean;
  meals: Meal[];
  preWorkoutMeal: Meal | null;
  postWorkoutMeal: Meal | null;
  diet: Diet;
  allergies: Allergen[];
  likedFoods: string[];
  equipment: Equipment[];
  cookMinutes: MaxMinutes;
  onboarded: boolean;
  healthConsent: boolean;
}

export const STEPS = ["goal", "meals", "restrictions", "foods", "kitchen", "summary"] as const;
export type Step = (typeof STEPS)[number];

/** O que a pessoa vai escolhendo (os números ficam em texto enquanto escreve). */
export interface Draft {
  weightText: string;
  weightConfirmed: boolean;
  manual: boolean;
  manualText: string;
  intensity: Intensity;
  meals: Meal[];
  trains: boolean;
  preWorkoutMeal: Meal | null;
  postWorkoutMeal: Meal | null;
  diet: Diet;
  allergies: Allergen[];
  likedFoods: string[];
  cookMinutes: MaxMinutes;
  equipment: Equipment[];
  healthConsent: boolean;
}

export function parseNumber(text: string): number {
  const trimmed = text.replace(",", ".").trim();
  return trimmed === "" ? Number.NaN : Number(trimmed);
}

const formatWeight = (kg: number) => String(kg).replace(".", ",");

export function initialDraft(profile: ClientProfile | null): Draft {
  if (!profile?.onboarded) {
    return {
      weightText: profile?.weightKg ? formatWeight(profile.weightKg) : "",
      weightConfirmed: false,
      manual: false,
      manualText: "",
      intensity: DEFAULT_INTENSITY,
      meals: [...DEFAULT_COMBINATIONS[4]],
      trains: false,
      preWorkoutMeal: null,
      postWorkoutMeal: null,
      diet: DEFAULT_DIET,
      allergies: [],
      likedFoods: [],
      cookMinutes: DEFAULT_COOK_MINUTES,
      equipment: [...DEFAULT_EQUIPMENT],
      healthConsent: false,
    };
  }
  return {
    weightText: profile.weightKg ? formatWeight(profile.weightKg) : "",
    weightConfirmed: true,
    manual: profile.manualTarget,
    manualText: profile.manualTarget ? String(profile.dailyTargetG) : "",
    intensity: profile.intensity,
    meals: [...profile.meals],
    trains: profile.preWorkoutMeal !== null || profile.postWorkoutMeal !== null,
    preWorkoutMeal: profile.preWorkoutMeal,
    postWorkoutMeal: profile.postWorkoutMeal,
    diet: profile.diet,
    allergies: [...profile.allergies],
    likedFoods: [...profile.likedFoods],
    cookMinutes: profile.cookMinutes,
    equipment: [...profile.equipment],
    healthConsent: profile.healthConsent,
  };
}

export interface GoalState {
  weight: number;
  weightOk: boolean;
  needsConfirm: boolean;
  manualOk: boolean;
  /** A meta, se o passo estiver completo. */
  target: number | null;
}

export function goalState(d: Draft): GoalState {
  const weight = parseNumber(d.weightText);
  const weightOk = isPlausibleWeight(weight);
  const needsConfirm = weightOk && weightNeedsConfirmation(weight);
  const manualGrams = parseNumber(d.manualText);
  const manualOk = isValidManualTarget(manualGrams);
  const target = d.manual
    ? manualOk
      ? manualGrams
      : null
    : weightOk && (!needsConfirm || d.weightConfirmed)
      ? dailyTarget(weight, d.intensity)
      : null;
  return { weight, weightOk, needsConfirm, manualOk, target };
}

/** As refeições à volta do treino, já coerentes com as escolhidas. */
export function training(d: Draft) {
  if (!d.trains) return { preWorkoutMeal: null, postWorkoutMeal: null };
  return normalizeTraining(d.meals, d.preWorkoutMeal, d.postWorkoutMeal);
}

export function likedForDraft(d: Draft, foods: FoodIndex): string[] {
  return cleanLikedFoods(d.likedFoods, foods, { diet: d.diet, allergies: d.allergies });
}

export function hasHealthData(d: Draft): boolean {
  return (!d.manual && goalState(d).weightOk) || d.allergies.length > 0;
}

export function stepIsValid(step: Step, d: Draft, foods: FoodIndex): boolean {
  switch (step) {
    case "goal":
      return goalState(d).target !== null;
    case "meals":
      return d.meals.length >= 2;
    case "restrictions":
      return true;
    case "foods":
      return proteinCount(likedForDraft(d, foods), foods) >= MIN_LIKED_PROTEINS;
    case "kitchen":
      return d.equipment.length > 0;
    case "summary":
      return !hasHealthData(d) || d.healthConsent;
  }
}

/** O pedido para o servidor (savePreferencesAction). */
export function toInput(d: Draft, foods: FoodIndex): PreferencesInput {
  const goal = goalState(d);
  const meals = sortMeals(d.meals);
  return {
    weightKg: !d.manual && goal.weightOk ? goal.weight : null,
    intensity: d.intensity,
    manualTargetG: d.manual && goal.manualOk ? parseNumber(d.manualText) : null,
    meals,
    ...training({ ...d, meals }),
    diet: d.diet,
    allergies: d.allergies,
    likedFoods: likedForDraft(d, foods),
    equipment: d.equipment,
    cookMinutes: d.cookMinutes,
    healthConsent: d.healthConsent,
  };
}
