import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Response } from "@playwright/test";
import { ONBOARDED_STATE } from "./support/auth";

/**
 * O prato 3D (secção 11, "3D"): o three e os modelos só chegam quando devem, o canvas é decorativo
 * e o HTML continua a ser a fonte de verdade. Corre só no projeto desktop (cada teste escolhe a
 * largura) e com o WebGL do SwiftShader no Chromium headless.
 */
test.use({
  launchOptions: { args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"] },
});
test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Só no desktop (cada teste escolhe a largura)");
});

const PLATE = "[data-plate-3d]";

/** Regista os .glb e os chunks de JavaScript com o three (pelo conteúdo, não pelo nome). */
function watchNetwork(page: Page) {
  const seen = { models: [] as string[], three: [] as string[] };
  page.on("response", async (response: Response) => {
    const url = response.url();
    if (url.endsWith(".glb")) seen.models.push(url);
    if (/\/_next\/static\/.*\.js$/.test(url)) {
      const body = await response.text().catch(() => "");
      if (body.includes("WebGLRenderer")) seen.three.push(url);
    }
  });
  return seen;
}

/** Erros na consola ou exceções não apanhadas. */
function watchConsole(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(
    results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
  ).toEqual([]);
}

test.describe("página inicial no telemóvel (390 px)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("não pede o three nem modelos", async ({ page }) => {
    const network = watchNetwork(page);
    const errors = watchConsole(page);
    await page.goto("/");
    await page.waitForLoadState("load");
    // Chega ao dia exemplo e dá tempo ao browser para ficar livre
    await page.getByText("Um dia de 160 g, assim").scrollIntoViewIfNeeded();
    await page.waitForTimeout(3000);
    await expect(page.locator(PLATE)).toHaveCount(0);
    expect(network.models).toEqual([]);
    expect(network.three).toEqual([]);
    expect(errors).toEqual([]);
  });
});

test.describe("páginas sem 3D (1440 px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const path of ["/entrar", "/alimentos"]) {
    test(`${path} não pede o three nem modelos (nem nos prefetches dos links)`, async ({
      page,
    }) => {
      const network = watchNetwork(page);
      await page.goto(path);
      await page.waitForLoadState("load");
      await page.mouse.wheel(0, 2000);
      await page.waitForTimeout(2500);
      expect(network.models).toEqual([]);
      expect(network.three).toEqual([]);
    });
  }
});

test.describe("página inicial no desktop (1440 px)", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const scheme of ["light", "dark"] as const) {
    test(`o prato aparece depois de carregar e enche até à meta (${scheme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      const network = watchNetwork(page);
      const errors = watchConsole(page);
      await page.goto("/");
      const plate = page.locator(PLATE);
      await expect(plate.locator("canvas")).toBeVisible({ timeout: 15_000 });
      await expect(plate).toHaveAttribute("data-ready", "true", { timeout: 15_000 });
      // Todas as refeições do cartão entraram no prato
      await expect(plate).not.toHaveAttribute("data-pieces", "0");
      await expect(plate).toHaveAttribute("aria-hidden", "true");
      expect(network.three.length).toBeGreaterThan(0);
      expect(network.models.length).toBeGreaterThan(0);
      // O LCP continua a ser o texto do hero
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoAxeViolations(page);
      expect(errors).toEqual([]);
    });
  }

  test("sem JavaScript, o hero lê-se e não há canvas", async ({ browser }) => {
    const context = await browser.newContext({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Começar agora" }).first()).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    await context.close();
  });
});

test.describe("detalhe do alimento", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('só pede o three e o modelo depois de "Ver em 3D"; roda e repõe a vista', async ({
    page,
  }) => {
    const network = watchNetwork(page);
    const errors = watchConsole(page);
    await page.goto("/alimentos/ovo");
    await page.waitForLoadState("load");
    await page.waitForTimeout(1500);
    expect(network.models).toEqual([]);
    expect(network.three).toEqual([]);

    await page.getByRole("button", { name: "Ver em 3D" }).click();
    const viewer = page.getByRole("group", { name: /Ovo, 1 ovo médio, em 3D/ });
    await expect(viewer.locator("canvas")).toBeVisible({ timeout: 15_000 });
    await expect(viewer.locator(PLATE)).toHaveAttribute("data-ready", "true", {
      timeout: 15_000,
    });
    await expect(viewer.locator(PLATE)).toHaveAttribute("data-pieces", "1");
    expect(network.models.length).toBe(1);
    expect(network.three.length).toBeGreaterThan(0);

    // Setas rodam; "Repor vista" volta ao início
    await viewer.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowDown");
    await expect(viewer).not.toHaveAttribute("data-yaw", "0.00");
    await expect(viewer).not.toHaveAttribute("data-pitch", "0.00");
    const reset = page.getByRole("button", { name: "Repor vista" });
    expect((await reset.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await reset.click();
    await expect(viewer).toHaveAttribute("data-yaw", "0.00");
    await expect(viewer).toHaveAttribute("data-pitch", "0.00");

    // Arrastar também roda
    const box = (await viewer.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 4 });
    await page.mouse.up();
    await expect(viewer).not.toHaveAttribute("data-yaw", "0.00");

    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await expectNoAxeViolations(page);
    }
    expect(errors).toEqual([]);
  });

  test("duas tangerinas: uma peça por unidade da porção típica", async ({ page }) => {
    await page.goto("/alimentos/tangerina");
    await page.getByRole("button", { name: "Ver em 3D" }).click();
    await expect(page.locator(PLATE)).toHaveAttribute("data-pieces", "2", { timeout: 15_000 });
  });
});

test.describe("o meu dia", () => {
  test.use({ storageState: ONBOARDED_STATE, viewport: { width: 1440, height: 900 } });

  /** Escolhe um alimento que ainda não está no lanche (uma peça nova, não uma porção a mais). */
  async function addFoodToSnack(page: Page) {
    const snack = page.locator("#refeicao-lanche");
    const candidates = ["Kiwi", "Pera", "Tangerina", "Laranja", "Maçã"];
    let chosen: string | undefined;
    for (const name of candidates) {
      if ((await snack.getByRole("link", { name, exact: true }).count()) === 0) {
        chosen = name;
        break;
      }
    }
    expect(chosen).toBeDefined();
    await snack.getByRole("button", { name: "Adicionar alimento" }).click();
    const drawer = page.getByRole("dialog");
    await drawer.getByRole("searchbox").or(drawer.getByRole("textbox")).first().fill(chosen!);
    await drawer
      .getByRole("button", { name: `Adicionar ${chosen}` })
      .first()
      .click();
    await expect(drawer.getByText(`${chosen} adicionado.`)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(snack.getByRole("link", { name: chosen!, exact: true })).toBeVisible();
  }

  /** O HTML (GoalProgress) continua certo: "Faltam X g" = meta − total (ou "Meta atingida"). */
  async function expectProgressConsistent(page: Page) {
    const progress = page.getByRole("progressbar", { name: "Proteína do dia" }).first();
    const now = Number(await progress.getAttribute("aria-valuenow"));
    const max = Number(await progress.getAttribute("aria-valuemax"));
    const message = (await page
      .getByText(/^(Faltam \d+ g\.|Meta atingida.*)$/)
      .first()
      .textContent())!;
    if (now < max) {
      const missing = Number(/Faltam (\d+) g/.exec(message)?.[1]);
      expect(Math.abs(missing - (max - now))).toBeLessThanOrEqual(1);
    } else {
      expect(message).toMatch(/^Meta atingida/);
    }
  }

  test("adicionar um alimento acrescenta uma peça ao prato", async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto("/o-meu-dia");
    const plate = page.locator(PLATE);
    await expect(plate).toHaveAttribute("data-ready", "true", { timeout: 15_000 });
    const before = Number(await plate.getAttribute("data-pieces"));
    await addFoodToSnack(page);
    await expect(plate).toHaveAttribute("data-pieces", String(before + 1));
    await expectProgressConsistent(page);
    for (const scheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme: scheme });
      await expectNoAxeViolations(page);
    }
    expect(errors).toEqual([]);
  });

  test("com prefers-reduced-motion, as peças aparecem logo no sítio", async ({ page }) => {
    await page.goto("/o-meu-dia");
    const plate = page.locator(PLATE);
    await expect(plate).toHaveAttribute("data-ready", "true", { timeout: 15_000 });
    await plate.evaluate((node) => {
      (window as unknown as { animated: boolean }).animated = false;
      new MutationObserver(() => {
        if (node.getAttribute("data-animating") === "true") {
          (window as unknown as { animated: boolean }).animated = true;
        }
      }).observe(node, { attributes: true });
    });
    await addFoodToSnack(page);
    await page.waitForTimeout(500);
    expect(await page.evaluate(() => (window as unknown as { animated: boolean }).animated)).toBe(
      false,
    );
  });

  test.describe("sem reduced motion", () => {
    test.use({ reducedMotion: "no-preference" });

    test("uma peça nova cai no prato e para", async ({ page }) => {
      await page.goto("/o-meu-dia");
      const plate = page.locator(PLATE);
      await expect(plate).toHaveAttribute("data-ready", "true", { timeout: 15_000 });
      await plate.evaluate((node) => {
        (window as unknown as { animated: boolean }).animated = false;
        new MutationObserver(() => {
          if (node.getAttribute("data-animating") === "true") {
            (window as unknown as { animated: boolean }).animated = true;
          }
        }).observe(node, { attributes: true });
      });
      await addFoodToSnack(page);
      await expect
        .poll(() => page.evaluate(() => (window as unknown as { animated: boolean }).animated))
        .toBe(true);
      // Nada anda sozinho: a animação acaba
      await expect(plate).toHaveAttribute("data-animating", "false");
    });
  });

  test("telemóvel: bloco recolhível, fechado por omissão; o three só chega ao abrir", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const network = watchNetwork(page);
    await page.goto("/o-meu-dia");
    const summary = page.getByText("O teu prato em 3D");
    await expect(summary).toBeVisible();
    await page.waitForTimeout(1500);
    expect(network.three).toEqual([]);
    expect(network.models).toEqual([]);
    await summary.click();
    await expect(page.locator(PLATE)).toHaveAttribute("data-ready", "true", { timeout: 15_000 });
    await expect(page.locator(`${PLATE} canvas`)).toHaveCount(1);
  });
});
