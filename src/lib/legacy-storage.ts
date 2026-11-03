/**
 * Até novembro de 2026 o dia vivia numa cópia no localStorage (com o peso). Agora vive só na conta:
 * apaga o que tiver ficado no browser, uma vez por página.
 */
export const LEGACY_KEYS = ["protein-plate:guest"] as const;

export function clearLegacyStorage(): void {
  try {
    for (const key of LEGACY_KEYS) window.localStorage.removeItem(key);
  } catch {
    // armazenamento bloqueado: não há nada a apagar
  }
}
