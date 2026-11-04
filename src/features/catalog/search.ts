/** Normaliza para pesquisa: minúsculas e sem acentos ("grao" encontra "grão"). */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
