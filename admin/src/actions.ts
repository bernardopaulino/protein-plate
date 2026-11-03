/**
 * As únicas escritas do backoffice, cada uma num POST com o token do formulário (csrf.ts) e
 * atrás do Access: terminar as sessões de uma conta e apagar uma conta. Usam a D1 tal como vem
 * do binding (as páginas leem pela D1 só de leitura, db.ts).
 */

/** Termina todas as sessões da conta: no próximo pedido, a app pede para entrar de novo. */
export async function endSessions(d1: D1Database, userId: string): Promise<number> {
  const result = await d1.prepare("delete from session where user_id = ?").bind(userId).run();
  return result.meta.changes ?? 0;
}

/**
 * Apaga a conta como o "Apagar conta" da app (o deleteUser do Better Auth): as sessões, as
 * ligações ao Google e à Apple e a conta, num só batch. O resto sai em cascata pelas chaves
 * estrangeiras (perfil, dias, itens dos dias e receitas guardadas). As receitas geradas ficam
 * (não têm dono). Ficam de fora, sem forma de as ligar à pessoa: os contadores das quotas (HMAC
 * com IP_HASH_SECRET, que o backoffice não tem; o cron apaga-os em 2 dias) e a revogação dos
 * tokens da Apple (cifrados com o segredo do Better Auth; só a app a faz).
 */
export async function deleteAccount(d1: D1Database, userId: string): Promise<void> {
  await d1.batch([
    d1.prepare("delete from session where user_id = ?").bind(userId),
    d1.prepare("delete from account where user_id = ?").bind(userId),
    d1.prepare('delete from "user" where id = ?').bind(userId),
  ]);
}
