/** HTML gerado no servidor: todo o texto que vem de dados ou de contas passa por aqui. */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Texto só para os leitores de ecrã (o que se vê já o diz de outra forma). */
export function srOnly(text: string): string {
  return `<span class="visually-hidden">${escapeHtml(text)}</span>`;
}
