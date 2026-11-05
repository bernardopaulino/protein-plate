import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import type { Allergen, Category, Ease, Processing, Role, WeightBasis } from "@/domain/food";
import type { Intensity } from "@/domain/goal";
import type { Meal } from "@/domain/meals";
import type { Diet, Equipment } from "@/domain/preferences";
import { user } from "./auth-schema";

// Datas em epoch ms (integer), booleanos em integer, JSON em text validado com Zod ao ler.
// snake_case na base, camelCase no TypeScript.

/* ---------------------------------------------------------------- Alimentos (só o seed escreve) */

export const foods = sqliteTable(
  "foods",
  {
    id: text("id").primaryKey(),
    namePt: text("name_pt").notNull(),
    nameEn: text("name_en").notNull(),
    category: text("category").$type<Category>().notNull(),
    role: text("role").$type<Role>().notNull(),
    proteinPer100g: real("protein_per_100g").notNull(),
    kcalPer100g: real("kcal_per_100g").notNull(),
    carbsPer100g: real("carbs_per_100g").notNull(),
    fatPer100g: real("fat_per_100g").notNull(),
    weightBasis: text("weight_basis").$type<WeightBasis>().notNull(),
    processing: text("processing").$type<Processing>().notNull(),
    ease: integer("ease").$type<Ease>().notNull(),
    exampleRank: integer("example_rank").notNull(),
    tcaCode: text("tca_code").notNull(),
    ideasPt: text("ideas_pt", { mode: "json" }).$type<string[]>().notNull(),
    ideasEn: text("ideas_en", { mode: "json" }).$type<string[]>().notNull(),
    dataVersion: integer("data_version").notNull(),
  },
  (t) => [index("foods_role_category_idx").on(t.role, t.category)],
);

export const foodPortions = sqliteTable(
  "food_portions",
  {
    id: text("id").primaryKey(),
    foodId: text("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    labelPt: text("label_pt").notNull(),
    labelEn: text("label_en").notNull(),
    grams: real("grams").notNull(),
    isDefault: integer("is_default", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    index("food_portions_food_idx").on(t.foodId),
    // Uma só porção por defeito em cada alimento
    uniqueIndex("food_portions_one_default_idx")
      .on(t.foodId)
      .where(sql`${t.isDefault} = 1`),
  ],
);

export const foodMoments = sqliteTable(
  "food_moments",
  {
    foodId: text("food_id")
      .notNull()
      .references(() => foods.id, { onDelete: "cascade" }),
    moment: text("moment").$type<Meal>().notNull(),
  },
  (t) => [primaryKey({ columns: [t.foodId, t.moment] })],
);

/* ---------------------------------------------------------------- Conta e preferências */

export const profiles = sqliteTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  dailyTargetG: integer("daily_target_g").notNull(),
  intensity: text("intensity").$type<Intensity>().notNull(),
  /** Peso (kg) para calcular a meta; só com o consentimento de dados de saúde (migração 0002). */
  weightKg: real("weight_kg"),
  /** Meta escrita à mão (sem peso). */
  manualTarget: integer("manual_target", { mode: "boolean" }).notNull().default(false),
  meals: text("meals", { mode: "json" }).$type<Meal[]>().notNull(),
  preWorkoutMeal: text("pre_workout_meal").$type<Meal>(),
  postWorkoutMeal: text("post_workout_meal").$type<Meal>(),
  diet: text("diet").$type<Diet>().notNull().default("omnivore"),
  /** Alergénios excluídos (dados de saúde: só com consentimento explícito). */
  allergies: text("allergies", { mode: "json" })
    .$type<Allergen[]>()
    .notNull()
    .default(sql`'[]'`),
  /** Alimentos de que gosta e tem no dia a dia (ids do catálogo). */
  likedFoods: text("liked_foods", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  equipment: text("equipment", { mode: "json" })
    .$type<Equipment[]>()
    .notNull()
    .default(sql`'["stove","microwave"]'`),
  cookMinutes: integer("cook_minutes").notNull().default(20),
  locale: text("locale").$type<"pt" | "en">().notNull().default("pt"),
  consentVersion: integer("consent_version"),
  consentedAt: integer("consented_at"),
  /** Consentimento explícito para guardar o peso e as alergias (RGPD, art. 9.º). */
  healthConsentAt: integer("health_consent_at"),
  /** Formulário de boas-vindas concluído (sem isto, a app pede-o antes de tudo o resto). */
  onboardedAt: integer("onboarded_at"),
  lastImportId: text("last_import_id"),
  updatedAt: integer("updated_at").notNull(),
});

export const dayPlans = sqliteTable(
  "day_plans",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    position: integer("position").notNull().default(0),
    updatedAt: integer("updated_at").notNull(),
  },
  (t) => [unique("day_plans_user_name_unique").on(t.userId, t.name)],
);

// food_id e portion_id sem chave estrangeira: o seed reescreve o catálogo e um alimento retirado
// não pode apagar o dia de ninguém (a app ignora itens que já não existem).
export const planItems = sqliteTable(
  "plan_items",
  {
    id: text("id").primaryKey(),
    planId: text("plan_id")
      .notNull()
      .references(() => dayPlans.id, { onDelete: "cascade" }),
    meal: text("meal").$type<Meal>().notNull(),
    foodId: text("food_id").notNull(),
    portionId: text("portion_id").notNull(),
    portionCount: real("portion_count").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [
    index("plan_items_plan_idx").on(t.planId, t.position),
    check(
      "plan_items_portion_count_check",
      sql`${t.portionCount} >= 0.5 AND ${t.portionCount} <= 4 AND ${t.portionCount} * 2 = CAST(${t.portionCount} * 2 AS INTEGER)`,
    ),
  ],
);

/* ---------------------------------------------------------------- Receitas (imutáveis, sem dono) */

export const recipes = sqliteTable(
  "recipes",
  {
    id: text("id").primaryKey(),
    cacheKey: text("cache_key").notNull().unique(),
    locale: text("locale").$type<"pt" | "en">().notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    meal: text("meal").$type<Meal>().notNull(),
    postWorkout: integer("post_workout", { mode: "boolean" }).notNull(),
    servings: integer("servings").notNull(),
    /** "Gerar outra": 1 a 3 (entra na cache_key) */
    variant: integer("variant").notNull().default(1),
    prepMinutes: integer("prep_minutes").notNull(),
    steps: text("steps", { mode: "json" }).$type<string[]>().notNull(),
    proteinPerServingG: real("protein_per_serving_g").notNull(),
    mealTargetG: real("meal_target_g").notNull(),
    /** A proteína por dose foi escolhida pela pessoa (mealTargetG é esse valor), migração 0005 */
    customTarget: integer("custom_target", { mode: "boolean" }).notNull().default(false),
    /** Equipamento usado (vazio = sem cozinhar); null nas receitas anteriores à 0005 */
    equipment: text("equipment", { mode: "json" }).$type<Equipment[]>(),
    model: text("model").notNull(),
    promptVersion: integer("prompt_version").notNull(),
    foodDataVersion: integer("food_data_version").notNull(),
    inputTokens: integer("input_tokens"),
    outputTokens: integer("output_tokens"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("recipes_created_idx").on(t.createdAt)],
);

export const recipeIngredients = sqliteTable(
  "recipe_ingredients",
  {
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    position: integer("position").notNull(),
    foodId: text("food_id").notNull(),
    grams: real("grams").notNull(),
  },
  (t) => [primaryKey({ columns: [t.recipeId, t.position] })],
);

export const savedRecipes = sqliteTable(
  "saved_recipes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    savedAt: integer("saved_at").notNull(),
    /** Favorita: as receitas guardadas de que a pessoa mais gosta aparecem primeiro (migração 0003). */
    favorite: integer("favorite", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.recipeId] }),
    index("saved_recipes_user_idx").on(t.userId, t.savedAt),
  ],
);

/** Histórico: as receitas que a pessoa gerou (também as da cache), para as encontrar depois. */
export const userRecipes = sqliteTable(
  "user_recipes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.recipeId] }),
    index("user_recipes_user_idx").on(t.userId, t.createdAt),
  ],
);

/** A receita usada numa refeição do dia ("Usar no meu almoço"): uma por refeição. */
export const mealRecipes = sqliteTable(
  "meal_recipes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    meal: text("meal").$type<Meal>().notNull(),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    usedAt: integer("used_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.meal] })],
);

/* ---------------------------------------------------------------- Quotas */

/** Contadores diários (receitas novas por chave). `key_hash`: HMAC do IP com chave diária ou `user:<id>`/`global`. */
export const usageCounters = sqliteTable(
  "usage_counters",
  {
    keyHash: text("key_hash").notNull(),
    /** AAAA-MM-DD (UTC) */
    day: text("day").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.keyHash, t.day] }), index("usage_counters_day_idx").on(t.day)],
);

/* ---------------------------------------------------------------- Funcionamento (backoffice) */

/**
 * Contadores diários do funcionamento (migração 0004): só nomes de `OPS_METRICS`
 * (src/domain/ops-metrics.ts) e totais por dia, sem dados pessoais. O cron apaga-os após 90 dias.
 */
export const opsCounters = sqliteTable(
  "ops_counters",
  {
    /** AAAA-MM-DD (UTC) */
    day: text("day").notNull(),
    /** ex.: "recipes.ok.new", "auth.429" */
    metric: text("metric").notNull(),
    count: integer("count").notNull(),
  },
  (t) => [primaryKey({ columns: [t.day, t.metric] })],
);
