/**
 * Descarrega as ilustrações dos alimentos e da UI (Microsoft Fluent Emoji 3D, licença MIT),
 * converte-as para WebP 160×160 em public/images/{foods,ui} e gera
 * src/content/food-images.generated.ts.
 *
 * Correr com: npx tsx scripts/fetch-food-images.ts [--force]
 * Sem --force, as imagens que já existem não voltam a ser descarregadas.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const root = join(import.meta.dirname, "..");
const force = process.argv.includes("--force");

const REPO = "microsoft/fluentui-emoji";
// O jsDelivr recusa ficheiros que ainda não tem em cache (o repositório passa o limite de 50 MB),
// por isso há fallback para o raw do GitHub.
const SOURCES = [
  `https://cdn.jsdelivr.net/gh/${REPO}@main/assets/`,
  `https://raw.githubusercontent.com/${REPO}/main/assets/`,
];
const LICENSE_URL = `https://raw.githubusercontent.com/${REPO}/main/LICENSE`;

const SIZE = 160;
const QUALITY = 80;

// Alimento → nome da pasta do emoji em microsoft/fluentui-emoji/assets.
const FOOD_EMOJI: Record<string, string> = {
  // carne
  "peito-frango": "Poultry leg",
  "peito-peru": "Poultry leg",
  "carne-picada-vaca": "Cut of meat",
  "coxa-frango": "Poultry leg",
  "carne-picada-peru": "Poultry leg",
  "bife-vaca": "Cut of meat",
  "bife-vitela": "Cut of meat",
  "lombo-porco": "Cut of meat",
  "febras-porco": "Cut of meat",
  coelho: "Meat on bone",
  "perna-borrego": "Meat on bone",
  "figado-vaca": "Cut of meat",
  "peito-pato": "Poultry leg",
  presunto: "Bacon",

  // cereais
  "aveia-flocos": "Bowl with spoon",
  "arroz-branco": "Cooked rice",
  "massa-trigo": "Spaghetti",
  "pao-integral": "Bread",
  "arroz-integral": "Cooked rice",
  "massa-integral": "Spaghetti",
  quinoa: "Cooked rice",
  cuscuz: "Cooked rice",
  bulgur: "Cooked rice",
  "trigo-sarraceno": "Cooked rice",
  "pao-mistura": "Bread",
  "pao-centeio": "Bread",
  "broa-milho": "Ear of corn",

  // conservas
  "atum-lata-natural": "Fish",
  "sardinhas-lata": "Fish",
  "salmao-fumado": "Fish",
  "atum-lata-azeite": "Fish",
  "cavala-lata": "Fish",
  "mexilhao-conserva": "Oyster",

  // despensa
  azeite: "Olive",
  alho: "Garlic",
  limao: "Lemon",
  manteiga: "Butter",
  sal: "Salt",
  vinagre: "Jar",
  mel: "Honey pot",
  "pimenta-preta": "Salt",
  colorau: "Hot pepper",
  cominhos: "Salt",
  caril: "Curry rice",
  oregaos: "Herb",
  salsa: "Herb",
  coentros: "Herb",
  manjericao: "Herb",
  gengibre: "Ginger root",
  canela: "Salt",
  cacau: "Chocolate bar",
  "polpa-tomate": "Canned food",
  "leite-coco": "Coconut",
  mostarda: "Jar",

  // fruta
  banana: "Banana",
  maca: "Red apple",
  pera: "Pear",
  laranja: "Tangerine",
  tangerina: "Tangerine",
  kiwi: "Kiwi fruit",
  morangos: "Strawberry",
  mirtilos: "Blueberries",
  framboesas: "Strawberry",
  uvas: "Grapes",
  manga: "Mango",
  ananas: "Pineapple",
  pessego: "Peach",
  melao: "Melon",
  melancia: "Watermelon",
  figos: "Pear",
  cerejas: "Cherries",
  ameixas: "Peach",
  roma: "Red apple",
  tamaras: "Chestnut",
  abacate: "Avocado",

  // frutos secos (os de árvore usam a castanha, como o ícone da alergia)
  amendoa: "Chestnut",
  "manteiga-amendoim": "Peanuts",
  noz: "Chestnut",
  amendoim: "Peanuts",
  caju: "Chestnut",
  avela: "Chestnut",
  pistacio: "Chestnut",

  // laticínios
  "leite-meio-gordo": "Glass of milk",
  "iogurte-grego-natural": "Bowl with spoon",
  "skyr-natural": "Bowl with spoon",
  "queijo-fresco": "Cheese wedge",
  requeijao: "Bowl with spoon",
  "queijo-cottage": "Bowl with spoon",
  "queijo-flamengo": "Cheese wedge",
  "leite-magro": "Glass of milk",
  "iogurte-natural": "Bowl with spoon",
  "quark-natural": "Bowl with spoon",
  "kefir-natural": "Glass of milk",
  ricota: "Bowl with spoon",
  "mozzarella-fresca": "Cheese wedge",
  "queijo-sao-jorge": "Cheese wedge",
  parmesao: "Cheese wedge",
  "queijo-cabra-curado": "Cheese wedge",

  // legumes
  brocolos: "Broccoli",
  espinafres: "Leafy green",
  tomate: "Tomato",
  "couve-flor": "Broccoli",
  "couve-portuguesa": "Leafy green",
  "couve-kale": "Leafy green",
  "couve-bruxelas": "Leafy green",
  cenoura: "Carrot",
  pepino: "Cucumber",
  alface: "Green salad",
  rucula: "Green salad",
  pimento: "Bell pepper",
  cebola: "Onion",
  courgette: "Cucumber",
  beringela: "Eggplant",
  cogumelos: "Brown mushroom",
  "feijao-verde": "Pea pod",
  espargos: "Leafy green",
  abobora: "Roasted sweet potato",
  beterraba: "Onion",

  // leguminosas
  "grao-bico-lata": "Beans",
  "feijao-lata": "Beans",
  tremocos: "Beans",
  "grao-bico": "Beans",
  "feijao-preto": "Beans",
  "feijao-encarnado": "Beans",
  "feijao-branco": "Beans",
  "feijao-frade": "Beans",
  "lentilhas-castanhas": "Beans",
  "lentilhas-vermelhas": "Beans",
  ervilhas: "Pea pod",
  favas: "Pea pod",
  "massa-lentilhas": "Spaghetti",

  // marisco
  camarao: "Shrimp",
  polvo: "Octopus",
  lulas: "Squid",
  choco: "Squid",
  mexilhao: "Oyster",
  ameijoas: "Oyster",

  // ovos
  ovo: "Egg",
  "claras-ovo": "Cooking",
  "ovos-codorniz": "Nest with eggs",

  // peixe
  salmao: "Fish",
  pescada: "Fish",
  "bacalhau-demolhado": "Fish",
  "atum-fresco": "Fish",
  sardinha: "Fish",
  carapau: "Fish",
  cavala: "Fish",
  dourada: "Fish",
  robalo: "Fish",
  "peixe-espada-preto": "Fish",
  tamboril: "Fish",
  linguado: "Fish",
  truta: "Fish",

  // sementes
  "sementes-abobora": "Seedling",
  "sementes-girassol": "Sunflower",
  "sementes-chia": "Seedling",
  "sementes-linhaca": "Seedling",
  "sementes-canhamo": "Seedling",
  sesamo: "Seedling",
  tahini: "Jar",

  // soja
  "tofu-firme": "Beans",
  edamame: "Pea pod",
  tempeh: "Beans",
  "soja-grao": "Beans",

  // suplementos
  "whey-sem-sabor": "Glass of milk",

  // tubérculos
  batata: "Potato",
  "batata-doce": "Roasted sweet potato",
  mandioca: "Potato",
};

// Imagem genérica para alimentos sem ilustração própria.
const FALLBACK_EMOJI = "Fork and knife with plate";

// Ícones da UI (refeições, intensidades, dietas, alergias, equipamento, celebração).
const UI_EMOJI: Record<string, string> = {
  "meal:pequeno-almoco": "Hot beverage",
  "meal:meio-da-manha": "Croissant",
  "meal:almoco": "Fork and knife with plate",
  "meal:lanche": "Sandwich",
  "meal:jantar": "Pot of food",
  "meal:ceia": "Crescent moon",

  "intensity:base": "Person walking",
  "intensity:moderada": "Person running",
  "intensity:alta": "Person lifting weights",
  "intensity:maxima": "Flexed biceps",

  "diet:omnivore": "Poultry leg",
  "diet:pescatarian": "Fish",
  "diet:vegetarian": "Egg",
  "diet:vegan": "Seedling",

  "allergy:milk": "Glass of milk",
  "allergy:gluten": "Bread",
  "allergy:egg": "Egg",
  "allergy:fish": "Fish",
  "allergy:shellfish": "Shrimp",
  "allergy:tree-nuts": "Chestnut",
  "allergy:peanut": "Peanuts",
  "allergy:soy": "Beans",
  "allergy:sesame": "Herb",
  "allergy:lupin": "Pea pod",
  "allergy:mustard": "Hot pepper",

  "equipment:stove": "Fire",
  "equipment:oven": "Shallow pan of food",
  "equipment:microwave": "Timer clock",
  "equipment:airfryer": "Dashing away",
  "equipment:blender": "Tropical drink",

  // Subgrupos de alimentos (src/domain/food-groups.ts): uma imagem diferente por subgrupo
  "group:aves": "Poultry leg",
  "group:carne": "Cut of meat",
  "group:peixe": "Fish",
  "group:conservas": "Canned food",
  "group:marisco": "Shrimp",
  "group:ovos": "Egg",
  "group:leite-iogurtes": "Glass of milk",
  "group:queijos": "Cheese wedge",
  "group:leguminosas": "Beans",
  "group:soja": "Pea pod",
  "group:pao": "Bread",
  "group:arroz-massa": "Cooked rice",
  "group:cereais": "Bowl with spoon",
  "group:tuberculos": "Potato",
  "group:fruta-dia": "Red apple",
  "group:frutos-vermelhos": "Strawberry",
  "group:fruta-verao": "Watermelon",
  "group:fruta-outras": "Avocado",
  "group:folhas": "Leafy green",
  "group:couves": "Broccoli",
  "group:salada": "Tomato",
  "group:cozinhar": "Eggplant",
  "group:frutos-secos": "Chestnut",
  "group:amendoim": "Peanuts",
  "group:sementes": "Sunflower",

  "misc:all": "Fork and knife with plate",
  "misc:party": "Party popper",
  "misc:target": "Bullseye",
  "misc:sparkles": "Sparkles",
  "misc:muscle": "Flexed biceps",
  "misc:wave": "Waving hand",
};

const slug = (emoji: string) =>
  emoji
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Caminhos possíveis do PNG 3D: normal, ou a variante "Default" dos emojis com tom de pele.
function candidatePaths(emoji: string): string[] {
  const file = emoji.toLowerCase().replace(/ /g, "_");
  const folder = encodeURIComponent(emoji);
  return [`${folder}/3D/${file}_3d.png`, `${folder}/Default/3D/${file}_3d_default.png`];
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function download(emoji: string): Promise<Buffer> {
  for (const path of candidatePaths(emoji)) {
    for (const base of SOURCES) {
      const response = await fetch(base + path);
      if (!response.ok) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.subarray(0, 8).equals(PNG_SIGNATURE)) return bytes;
    }
  }
  throw new Error(`Sem PNG 3D para o emoji "${emoji}"`);
}

async function writeWebp(emoji: string, dir: string): Promise<void> {
  const target = join(dir, `${slug(emoji)}.webp`);
  if (!force && existsSync(target)) return;
  const png = await download(emoji);
  await sharp(png)
    .resize(SIZE, SIZE, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: QUALITY, alphaQuality: 90, effort: 6 })
    .toFile(target);
  console.log(`  ${target.slice(root.length + 1)}`);
}

// Ids do catálogo, pela ordem dos ficheiros em content/foods.
function catalogIds(): string[] {
  const dir = join(root, "content", "foods");
  return readdirSync(dir)
    .filter((file) => file.endsWith(".json") && file !== "meta.json")
    .sort()
    .flatMap((file) => {
      const foods = JSON.parse(readFileSync(join(dir, file), "utf8")) as { id: string }[];
      return foods.map((food) => food.id);
    });
}

// Apaga WebPs que já não são usados (só nas pastas geridas por este script).
function prune(dir: string, keep: Set<string>): void {
  for (const file of readdirSync(dir)) {
    if (file.endsWith(".webp") && !keep.has(file)) {
      rmSync(join(dir, file));
      console.log(`  removido ${file}`);
    }
  }
}

const ids = catalogIds();
const missing = ids.filter((id) => !(id in FOOD_EMOJI));
const unknown = Object.keys(FOOD_EMOJI).filter((id) => !ids.includes(id));
if (missing.length > 0 || unknown.length > 0) {
  console.error("fetch-food-images: o mapa não coincide com o catálogo");
  for (const id of missing) console.error(`  - sem imagem: ${id}`);
  for (const id of unknown) console.error(`  - id inexistente: ${id}`);
  process.exit(1);
}

const foodsDir = join(root, "public", "images", "foods");
const uiDir = join(root, "public", "images", "ui");
mkdirSync(foodsDir, { recursive: true });
mkdirSync(uiDir, { recursive: true });

const foodEmojis = new Set([...Object.values(FOOD_EMOJI), FALLBACK_EMOJI]);
const uiEmojis = new Set(Object.values(UI_EMOJI));

console.log(`fetch-food-images: ${foodEmojis.size} imagens de alimentos, ${uiEmojis.size} da UI`);
for (const emoji of foodEmojis) await writeWebp(emoji, foodsDir);
for (const emoji of uiEmojis) await writeWebp(emoji, uiDir);
prune(foodsDir, new Set([...foodEmojis].map((emoji) => `${slug(emoji)}.webp`)));
prune(uiDir, new Set([...uiEmojis].map((emoji) => `${slug(emoji)}.webp`)));

const license = await fetch(LICENSE_URL);
if (!license.ok) throw new Error(`LICENSE: HTTP ${license.status}`);
writeFileSync(join(root, "public", "images", "LICENSE-fluent-emoji.txt"), await license.text());

// Chaves sem aspas quando possível, para o ficheiro sair já no formato do Prettier.
const property = (key: string) => (/^[a-z_$][\w$]*$/i.test(key) ? key : JSON.stringify(key));
const entries = (map: Record<string, string>, folder: string, order: string[]) =>
  order.map((key) => `  ${property(key)}: "/images/${folder}/${slug(map[key]!)}.webp",`).join("\n");

const moduleSource = `// Gerado por scripts/fetch-food-images.ts. Não editar à mão.
// Ilustrações: Microsoft Fluent Emoji 3D (licença MIT), ver public/images/LICENSE-fluent-emoji.txt.

export const FOOD_IMAGE_FALLBACK = "/images/foods/${slug(FALLBACK_EMOJI)}.webp";

export const FOOD_IMAGES: Record<string, string> = {
${entries(FOOD_EMOJI, "foods", ids)}
};

export const UI_IMAGES: Record<string, string> = {
${entries(UI_EMOJI, "ui", Object.keys(UI_EMOJI))}
};

export function foodImage(foodId: string): string {
  return FOOD_IMAGES[foodId] ?? FOOD_IMAGE_FALLBACK;
}
`;
writeFileSync(join(root, "src", "content", "food-images.generated.ts"), moduleSource);
console.log("fetch-food-images ok: src/content/food-images.generated.ts");
