/**
 * Funções puras de formatação (datas, temperatura, método de entrada).
 * Todas retornam "--" quando recebem valores inválidos, nunca "NaN".
 */

const PLACEHOLDER = "--";

const numberFormat = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** "2026-10-18" -> "18/10/2026" */
export function formatDateBR(isoDate) {
  if (typeof isoDate !== "string") return PLACEHOLDER;
  const [year, month, day] = isoDate.split("-");
  return year && month && day ? `${day}/${month}/${year}` : PLACEHOLDER;
}

/** "2026-10-18" -> "18/10" (rótulo curto para eixos de gráfico) */
export function formatDateShort(isoDate) {
  return formatDateBR(isoDate).slice(0, 5);
}

/** 23.917 -> "23,9 °C" */
export function formatTemperature(value) {
  return Number.isFinite(value) ? `${numberFormat.format(value)} °C` : PLACEHOLDER;
}

/** Date -> "18/10/2026 14:32" */
export function formatDateTime(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return PLACEHOLDER;
  return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/** Número inteiro com separador de milhar: 3905 -> "3.905" */
export function formatInteger(value) {
  return Number.isFinite(value) ? value.toLocaleString("pt-BR") : PLACEHOLDER;
}

const METHOD_LABELS = {
  observacao_real: "Observação real",
  media_12_meses: "Média de 12 meses",
};

/** "media_12_meses" -> "Média de 12 meses" */
export function formatMethod(method) {
  return METHOD_LABELS[method] ?? method ?? PLACEHOLDER;
}

/**
 * Indica se a previsão usou um método de contingência (sem observação real
 * do dia anterior), o que reduz a confiabilidade.
 */
export function isFallbackMethod(method) {
  return method !== "observacao_real";
}

/** 61.234 -> "61,2 %" */
export function formatPercent(value) {
  return Number.isFinite(value) ? `${numberFormat.format(value)} %` : PLACEHOLDER;
}

/** "2026-10-18 03:10:00" ou "2026-10-18T03:10Z" -> "18/10/2026" (descarta a hora) */
export function formatIssuedDate(issuedAt) {
  return typeof issuedAt === "string" ? formatDateBR(issuedAt.slice(0, 10)) : PLACEHOLDER;
}
