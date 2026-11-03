import { dateTimeLabel, num } from "./format";

/**
 * As regras de privacidade do backoffice (docs/backoffice.md):
 *
 * - Os dados de saúde (o peso e as alergias, guardados só com o consentimento explícito do
 *   art. 9.º do RGPD) nunca aparecem por pessoa. Nenhuma consulta da ficha pede as colunas
 *   `weight_kg` nem `allergies` (os testes confirmam-no no HTML): a ficha diz só se há dados de
 *   saúde guardados e desde quando há consentimento.
 * - A intensidade do treino também não aparece na ficha: com a meta em gramas, dava o peso
 *   (a meta é o peso vezes 1,6 a 2,2 g por kg, conforme a intensidade).
 * - As alergias só aparecem no Painel, em contagens de pessoas por alergénio, e só a partir de
 *   MIN_GROUP pessoas; abaixo disso (incluindo zero) aparece "<5".
 * - As sessões não guardam IP nem user agent, e a ficha não os pede.
 */

/** Abaixo disto, uma contagem de pessoas com um dado de saúde aparece como "<5". */
export const MIN_GROUP = 5;

/** Uma contagem de dados de saúde: exata a partir de MIN_GROUP, "<5" abaixo (o zero também). */
export function healthCount(count: number): string {
  return count >= MIN_GROUP ? num(count) : `<${MIN_GROUP}`;
}

/** A linha da ficha sobre os dados de saúde: só se existem e desde quando, nunca quais. */
export function healthLine(healthConsentAt: number | null): string {
  return healthConsentAt === null
    ? "Sem dados de saúde"
    : `Dados de saúde guardados com consentimento em ${dateTimeLabel(healthConsentAt)} UTC`;
}
