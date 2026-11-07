/**
 * Modelos 3D dos alimentos (Kenney Food Kit, CC0): liga cada alimento de content/foods a um modelo
 * (pelo id e, por omissão, pelo subgrupo de src/domain/food-groups.ts), otimiza-os com
 * @gltf-transform/cli (dedup, prune, weld, quantize, texturas em WebP), grava-os em public/models
 * com o hash do conteúdo no nome (cache longa, ver public/_headers) e gera
 * src/content/food-models.generated.ts.
 *
 * A Kenney não deixa descarregar o pacote por script: descarrega-o à mão em
 * https://kenney.nl/assets/food-kit e corre
 *   npx tsx scripts/fetch-food-models.ts [caminho/para/kenney_food-kit.zip]
 * (por omissão procura kenney_food-kit.zip nas Transferências).
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { homedir, tmpdir } from "node:os";
import { basename, join } from "node:path";
import { foodSubgroup, type FoodSubgroup } from "../src/domain/food-groups";
import type { Food } from "../src/domain/food";

const root = join(import.meta.dirname, "..");
const outDir = join(root, "public", "models");
const zipPath =
  process.argv.slice(2).find((a) => !a.startsWith("--")) ??
  join(homedir(), "Downloads", "kenney_food-kit.zip");

// Subgrupo → modelo genérico (um alimento sem modelo próprio nunca fica um buraco no prato).
// O pacote não tem batata, leguminosas, tofu nem frutos secos: usam o que mais se parece.
const BY_SUBGROUP: Record<FoodSubgroup, string> = {
  aves: "wholer-ham",
  carne: "meat-cooked",
  peixe: "fish",
  conservas: "can-small",
  marisco: "mussel-open",
  ovos: "egg",
  "leite-iogurtes": "glass",
  queijos: "cheese",
  leguminosas: "bowl-soup",
  soja: "bowl-broth",
  pao: "loaf",
  "arroz-massa": "rice-ball",
  cereais: "bowl-cereal",
  tuberculos: "onion",
  "fruta-dia": "apple",
  "frutos-vermelhos": "strawberry",
  "fruta-verao": "pineapple",
  "fruta-outras": "advocado-half",
  folhas: "salad",
  couves: "broccoli",
  salada: "tomato",
  cozinhar: "eggplant",
  "frutos-secos": "bag",
  amendoim: "bag",
  sementes: "pudding",
};

// Alimento → modelo próprio (quando o pacote tem um que lhe corresponde melhor).
const BY_ID: Record<string, string> = {
  // aves e carne
  // Aves: a coxa (o modelo do subgrupo) lê-se como frango; o bife cozinhado parecia piza
  "carne-picada-peru": "meat-patty",
  "carne-picada-vaca": "meat-patty",
  "perna-borrego": "whole-ham",
  presunto: "bacon",
  // peixe e conservas
  "salmao-fumado": "fish",
  // ovos e laticínios
  "iogurte-grego-natural": "bowl",
  "iogurte-natural": "bowl",
  "skyr-natural": "bowl",
  "quark-natural": "bowl",
  "leite-magro": "carton",
  "leite-meio-gordo": "carton",
  "whey-sem-sabor": "frappe",
  "queijo-flamengo": "cheese-cut",
  "queijo-cabra-curado": "cheese-cut",
  "queijo-sao-jorge": "cheese-cut",
  "queijo-cottage": "bowl",
  ricota: "bowl",
  requeijao: "bowl",
  // leguminosas
  "feijao-lata": "can-open",
  "grao-bico-lata": "can-open",
  // pão, arroz e massa
  "pao-integral": "bread",
  "pao-centeio": "bread",
  "pao-mistura": "loaf-round",
  "broa-milho": "loaf-round",
  // Massa: a tigela de noodles (a caixa de takeaway lia-se como comida de fora)
  "massa-trigo": "bowl-broth",
  "massa-integral": "bowl-broth",
  // fruta
  banana: "banana",
  pera: "pear",
  laranja: "orange",
  tangerina: "orange",
  kiwi: "avocado",
  cerejas: "cherries",
  mirtilos: "grapes",
  uvas: "grapes",
  melancia: "watermelon",
  melao: "lemon-half",
  manga: "lemon",
  pessego: "orange",
  ameixas: "cherries",
  figos: "onion-half",
  roma: "apple",
  tamaras: "avocado",
  // legumes
  "couve-flor": "cauliflower",
  "couve-portuguesa": "cabbage",
  "couve-kale": "cabbage",
  "couve-bruxelas": "cabbage",
  beterraba: "beet",
  cebola: "onion-half",
  cenoura: "carrot",
  pepino: "celery-stick",
  pimento: "paprika",
  cogumelos: "mushroom",
  abobora: "pumpkin",
  courgette: "celery-stick",
  espargos: "leek",
  "feijao-verde": "celery-stick",
  // frutos secos e sementes
  "manteiga-amendoim": "peanut-butter",
  tahini: "peanut-butter",
  // despensa (não entra no dia, mas tem modelo na mesma)
  azeite: "bottle-oil",
  mel: "honey",
  limao: "lemon-half",
  alho: "onion-half",
};

// A despensa sem modelo próprio e qualquer alimento novo sem subgrupo.
const FALLBACK = "bowl-soup";

// Alimentos que se contam (1 ovo, 1 banana): a porção típica mostra uma peça por unidade. A unidade
// sai da primeira porção cujo rótulo começa por um número ("1 ovo médio", 50 g → 50 g por ovo;
// "2 tangerinas", 150 g → 75 g por tangerina).
const COUNTABLE: readonly string[] = [
  "ovo",
  "claras-ovo",
  "coxa-frango",
  "febras-porco",
  "lombo-porco",
  "presunto",
  "carapau",
  "sardinha",
  "salmao-fumado",
  "queijo-flamengo",
  "queijo-cabra-curado",
  "pao-integral",
  "pao-centeio",
  "banana",
  "maca",
  "pera",
  "laranja",
  "tangerina",
  "kiwi",
  "pessego",
  "ameixas",
  "figos",
  "tamaras",
  "batata",
  "batata-doce",
  "beterraba",
  "cenoura",
  "tomate",
];

function unzip(zip: string): string {
  const dir = join(tmpdir(), `kenney-food-kit-${process.pid}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  if (process.platform === "win32") {
    execFileSync(
      "powershell",
      [
        "-NoProfile",
        "-Command",
        "Expand-Archive -LiteralPath $env:PP_ZIP -DestinationPath $env:PP_DIR -Force",
      ],
      { env: { ...process.env, PP_ZIP: zip, PP_DIR: dir }, stdio: "inherit" },
    );
  } else {
    execFileSync("unzip", ["-q", zip, "-d", dir], { stdio: "inherit" });
  }
  return dir;
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function loadFoods(): Food[] {
  const dir = join(root, "content", "foods");
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json") && file !== "meta.json")
    .sort()
    .flatMap((file) => JSON.parse(readFileSync(join(dir, file), "utf8")) as Food[]);
}

const gltf = (args: string[]) =>
  execFileSync(
    process.execPath,
    [join(root, "node_modules", "@gltf-transform", "cli", "bin", "cli.js"), ...args],
    { stdio: ["ignore", "ignore", "inherit"] },
  );

/**
 * dedup → prune → weld → quantize → textura a 128 px → WebP; devolve o .glb otimizado. A textura é a
 * paleta partilhada do pacote (512 px, gradientes suaves): a 128 px não se nota e pesa 1/16.
 */
function optimize(source: string, work: string, name: string): Buffer {
  const steps = [
    ["dedup"],
    ["prune"],
    ["weld"],
    ["quantize"],
    ["resize", "--width", "128", "--height", "128"],
    ["webp", "--quality", "90"],
  ];
  let input = source;
  steps.forEach((step, i) => {
    const output = join(work, `${name}.${i}.glb`);
    gltf([step[0]!, input, output, ...step.slice(1)]);
    input = output;
  });
  return readFileSync(input);
}

// --- main ---

if (!existsSync(zipPath)) {
  console.error(
    `Não encontrei ${zipPath}. Descarrega o Food Kit em https://kenney.nl/assets/food-kit e passa o caminho do zip.`,
  );
  process.exit(1);
}

const extracted = unzip(zipPath);
const files = walk(extracted);

// Licença: tem de ser CC0 (fica ao lado da licença das ilustrações)
const licenseFile = files.find((f) => /licen[cs]e/i.test(basename(f)) && f.endsWith(".txt"));
if (!licenseFile) throw new Error("O pacote não traz o ficheiro de licença.");
const license = readFileSync(licenseFile, "utf8");
if (!/CC0|Creative Commons Zero|creativecommons\.org\/publicdomain\/zero/i.test(license)) {
  throw new Error("A licença do pacote já não é CC0: não usar sem rever.");
}

// Formato: GLB (ou glTF, que o gltf-transform converte)
const models = new Map<string, string>();
for (const file of files) {
  const match = /([^\\/]+)\.(glb|gltf)$/i.exec(file);
  if (!match) continue;
  const name = match[1]!;
  // Prefere o .glb ao .gltf quando há os dois
  if (!models.has(name) || file.toLowerCase().endsWith(".glb")) models.set(name, file);
}
if (models.size === 0) throw new Error("O pacote não tem modelos GLB nem glTF.");
if (process.argv.includes("--list")) {
  console.log([...models.keys()].sort().join("\n"));
  process.exit(0);
}

const foods = loadFoods();
const assignment = new Map<string, string>();
for (const food of foods) {
  const subgroup = foodSubgroup(food);
  assignment.set(food.id, BY_ID[food.id] ?? (subgroup ? BY_SUBGROUP[subgroup] : FALLBACK));
}
for (const id of Object.keys(BY_ID)) {
  if (!foods.some((f) => f.id === id))
    throw new Error(`BY_ID tem um alimento que não existe: ${id}`);
}
const used = new Set([...assignment.values(), FALLBACK]);
const missing = [...used].filter((name) => !models.has(name));
if (missing.length > 0) {
  throw new Error(`Modelos que não existem no pacote: ${missing.join(", ")} (corre com --list)`);
}

const unitGrams: Record<string, number> = {};
for (const id of COUNTABLE) {
  const food = foods.find((f) => f.id === id);
  const portion = food?.portions.find((p) => /^\d+\s/.test(p.label.pt));
  if (!portion) throw new Error(`${id}: sem porção contada ("1 ovo", "2 tangerinas")`);
  unitGrams[id] = Math.round(portion.grams / Number.parseInt(portion.label.pt, 10));
}

// Otimiza e grava com o hash do conteúdo no nome; apaga os .glb antigos
mkdirSync(outDir, { recursive: true });
for (const file of readdirSync(outDir)) {
  if (file.endsWith(".glb")) rmSync(join(outDir, file));
}
const work = join(extracted, "_work");
mkdirSync(work, { recursive: true });
const urls: Record<string, string> = {};
let bytes = 0;
for (const name of [...used].sort()) {
  const glb = optimize(models.get(name)!, work, name);
  const hash = createHash("sha256").update(glb).digest("hex").slice(0, 10);
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const fileName = `${slug}.${hash}.glb`;
  writeFileSync(join(outDir, fileName), glb);
  urls[name] = `/models/${fileName}`;
  bytes += glb.length;
  console.log(`  ${fileName} (${(glb.length / 1024).toFixed(1)} KB)`);
}
copyFileSync(licenseFile, join(outDir, "LICENSE-kenney.txt"));
rmSync(extracted, { recursive: true, force: true });

const q = (s: string) => JSON.stringify(s);
// Chaves sem aspas quando não são precisas (como o Prettier as escreve)
const key = (s: string) => (/^[A-Za-z_$][\w$]*$/.test(s) ? s : q(s));
const moduleSource = `// Gerado por scripts/fetch-food-models.ts. Não editar à mão.
// Modelos 3D: Kenney Food Kit (CC0), ver public/models/LICENSE-kenney.txt.

/** Cada modelo otimizado, com o hash do conteúdo no nome (cache longa). */
export const MODEL_URLS: Record<string, string> = {
${Object.entries(urls)
  .map(([name, url]) => `  ${key(name)}: ${q(url)},`)
  .join("\n")}
};

export const MODEL_FALLBACK = ${q(FALLBACK)};

/** Alimento → modelo (próprio ou o genérico do subgrupo). */
export const FOOD_MODELS: Record<string, string> = {
${[...assignment].map(([id, name]) => `  ${key(id)}: ${q(name)},`).join("\n")}
};

/** Gramas de uma unidade dos alimentos que se contam (1 ovo = 50 g). */
export const FOOD_UNIT_GRAMS: Record<string, number> = {
${Object.entries(unitGrams)
  .map(([id, grams]) => `  ${key(id)}: ${grams},`)
  .join("\n")}
};

export function foodModelUrl(foodId: string): string {
  return MODEL_URLS[FOOD_MODELS[foodId] ?? MODEL_FALLBACK]!;
}

/** Peças da porção típica no visualizador: unidades para o que se conta, senão 1. */
export function portionUnits(foodId: string, grams: number): number {
  const unit = FOOD_UNIT_GRAMS[foodId];
  return unit ? Math.max(1, Math.round(grams / unit)) : 1;
}
`;
writeFileSync(join(root, "src", "content", "food-models.generated.ts"), moduleSource);
console.log(
  `fetch-food-models ok: ${used.size} modelos, ${(bytes / 1024).toFixed(0)} KB no total; src/content/food-models.generated.ts`,
);
