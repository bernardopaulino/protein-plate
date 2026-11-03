import { test as setup } from "@playwright/test";
import { ONBOARDED_STATE, completeOnboarding, signIn } from "./support/auth";

/** Uma pessoa com o plano feito, partilhada pelos testes das páginas com login. */
setup("sessão com o formulário de boas-vindas concluído", async ({ context, page, baseURL }) => {
  await signIn(context, baseURL!, "e2e@protein-plate.local", { fresh: true });
  await completeOnboarding(page);
  await context.storageState({ path: ONBOARDED_STATE });
});
