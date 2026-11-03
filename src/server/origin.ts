/**
 * Pedidos de outro site são recusados (defesa em profundidade: o cookie da sessão já é
 * SameSite=Lax). Compara o cabeçalho Origin com a origem do próprio pedido. Sem Origin (apps
 * nativas, ferramentas), segue: a sessão continua a ser obrigatória.
 */
export function isCrossOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  return origin !== null && origin !== new URL(request.url).origin;
}
