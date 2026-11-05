// Imagens de partilha (Open Graph, 1200 × 630) em public/og/pt.png e public/og/en.png, com o
// Playwright: npm run og:images (correr outra vez quando mudar o texto ou a marca).
import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const repo = process.argv[2] ?? process.cwd();
const foods = join(repo, "public", "images", "foods");
const img = (name) =>
  `data:image/webp;base64,${readFileSync(join(foods, `${name}.webp`)).toString("base64")}`;

const COPY = {
  pt: {
    eyebrow: "Protein without the diet",
    title: "Proteína sem dieta.",
    body: "A tua meta de proteína com comida de verdade, em porções que reconheces.",
    chip: ["160 g num dia", "147 alimentos", "Receitas por IA"],
  },
  en: {
    eyebrow: "Real food, real portions",
    title: "Protein without the diet.",
    body: "Your protein goal with real food, in portions you recognize.",
    chip: ["160 g in a day", "147 foods", "AI recipes"],
  },
};

const html = (c) => `<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Figtree:wght@500;600&display=block" rel="stylesheet">
<style>
  *{margin:0;box-sizing:border-box}
  body{width:1200px;height:630px;background:#fbf8f3;font-family:Figtree,sans-serif;color:#1f1b16;overflow:hidden;position:relative}
  .card{position:absolute;inset:40px;border-radius:40px;background:#fff;border:2px solid #e3d9cb;padding:52px 72px;display:flex;flex-direction:column;justify-content:space-between}
  .logo{display:flex;align-items:center;gap:16px;font-family:'Bricolage Grotesque';font-weight:800;font-size:34px;letter-spacing:-0.5px}
  .eyebrow{color:#2f6b3a;font-weight:600;font-size:26px;margin-top:28px}
  h1{font-family:'Bricolage Grotesque';font-weight:800;font-size:84px;line-height:1;letter-spacing:-2px;margin-top:12px;max-width:600px}
  p{font-size:28px;color:#5d554b;margin-top:18px;max-width:600px;line-height:1.3}
  .chips{display:flex;gap:14px}
  .chip{background:#e3efe2;color:#1f1b16;font-weight:600;font-size:24px;padding:12px 22px;border-radius:999px}
  .foods{position:absolute;right:70px;top:120px;width:360px;height:400px}
  .foods img{position:absolute;filter:drop-shadow(0 18px 24px rgba(31,27,22,.18))}
  .plate{position:absolute;right:96px;top:150px;width:320px;height:320px;border-radius:50%;background:#e3efe2;border:14px solid #fbf8f3;box-shadow:0 0 0 2px #e3d9cb}
</style></head><body>
<div class="card">
  <div>
    <div class="logo"><svg viewBox="0 0 32 32" width="52" height="52"><circle cx="16" cy="16" r="15" fill="#2f6b3a"/><circle cx="16" cy="16" r="9.5" fill="#fff"/><path d="M16 6.5a9.5 9.5 0 0 1 9.5 9.5H16z" fill="#f2b33d"/></svg>Protein Plate</div>
    <div class="eyebrow">${c.eyebrow}</div>
    <h1>${c.title}</h1>
    <p>${c.body}</p>
  </div>
  <div class="chips">${c.chip.map((t) => `<span class="chip">${t}</span>`).join("")}</div>
</div>
<div class="plate"></div>
<div class="foods">
  <img src="${img("egg")}" style="width:150px;left:40px;top:10px">
  <img src="${img("fish")}" style="width:170px;left:180px;top:60px">
  <img src="${img("poultry-leg")}" style="width:150px;left:20px;top:170px">
  <img src="${img("broccoli")}" style="width:130px;left:200px;top:220px">
  <img src="${img("bowl-with-spoon")}" style="width:120px;left:120px;top:290px">
</div>
</body></html>`;

const out = join(repo, "public", "og");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});
for (const [locale, copy] of Object.entries(COPY)) {
  await page.setContent(html(copy), { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, `${locale}.png`), type: "png" });
  console.log(`og/${locale}.png`);
}
await browser.close();
