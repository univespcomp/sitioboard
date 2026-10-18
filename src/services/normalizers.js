import { ApiError } from "./apiClient";

/**
 * ÚNICO lugar que conhece o formato do JSON da API.
 * Se os nomes dos campos mudarem, ajuste só os aliases em FIELDS.
 *
 * Princípio: nunca confiar no que vem da rede. Cada registro é validado e
 * convertido para um formato interno estável; registros inválidos são
 * descartados, e se TODOS forem inválidos a tela mostra um erro claro.
 *
 * @typedef {Object} Forecast
 * @property {string}      targetDate        Data prevista (ISO yyyy-mm-dd)
 * @property {number}      temperatureC      Temperatura prevista (°C)
 * @property {string|null} baseDate          Data base usada como entrada
 * @property {number|null} baseTemperatureC  Temperatura média do dia-base
 * @property {number|null} humidityPct       Umidade média do dia-base
 * @property {string|null} method            Ex.: "observacao_real" | "media_12_meses"
 * @property {string|null} issuedAt          Quando a previsão foi emitida
 *
 * @typedef {Object} Observation
 * @property {string}      date              Data (ISO yyyy-mm-dd)
 * @property {number|null} humidityPct
 * @property {number|null} precipitationMm
 * @property {number|null} temperatureC
 */

/** Nomes aceitos para cada campo (o primeiro é o nome esperado da API). */
const FIELDS = {
  targetDate: ["data_prevista", "dataPrevista", "data_alvo"],
  baseDate: ["data_base", "dataBase"],
  temperatureC: ["temperatura_prevista_c", "temperatura_prevista", "temp_prevista_c"],
  baseTemperatureC: ["temp_media_c", "temperatura_media_c", "temp_media"],
  humidityPct: ["umidade_media_pct", "umidade_media", "umidade"],
  method: ["metodo_entrada", "metodo"],
  issuedAt: ["emitida_em", "emitidaEm"],
  date: ["data", "data_observacao", "date"],
  precipitationMm: ["precipitacao_mm", "precipitacao", "chuva_mm"],
};

/** Chaves sob as quais a lista pode vir embrulhada: { "dados": [...] }. */
const LIST_KEYS = [
  "dados", "data", "items", "itens", "resultados", "results",
  "registros", "observacoes", "previsoes",
];

const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}/;

const formatError = (detail) =>
  new ApiError(`A API retornou dados em formato inesperado${detail ? ` (${detail})` : ""}.`);

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);

/** Número finito ou null. Aceita "23,5" (vírgula decimal) e "23.5". */
export function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.trim().replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** "2026-10-18", "2026-10-18 03:00:00" ou "2026-10-18T03:00Z" -> "2026-10-18"; senão null. */
export function toIsoDate(value) {
  if (typeof value !== "string") return null;
  return value.trim().match(ISO_DATE_PREFIX)?.[0] ?? null;
}

/** Primeiro alias presente (e não vazio) no registro. */
function pick(record, field) {
  for (const key of FIELDS[field]) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

const toText = (value, max = 40) => (value == null ? null : String(value).slice(0, max));

/** @returns {Forecast|null} null quando faltam data prevista ou temperatura. */
export function mapForecast(raw) {
  if (!isObject(raw)) return null;
  const targetDate = toIsoDate(pick(raw, "targetDate"));
  const temperatureC = toNumber(pick(raw, "temperatureC"));
  if (!targetDate || temperatureC === null) return null;

  return {
    targetDate,
    temperatureC,
    baseDate: toIsoDate(pick(raw, "baseDate")),
    baseTemperatureC: toNumber(pick(raw, "baseTemperatureC")),
    humidityPct: toNumber(pick(raw, "humidityPct")),
    method: toText(pick(raw, "method")),
    issuedAt: toText(pick(raw, "issuedAt"), 30),
  };
}

/** @returns {Observation|null} null sem data ou sem nenhuma medição. */
export function mapObservation(raw) {
  if (!isObject(raw)) return null;
  const date = toIsoDate(pick(raw, "date"));
  const humidityPct = toNumber(pick(raw, "humidityPct"));
  const precipitationMm = toNumber(pick(raw, "precipitationMm"));
  const temperatureC = toNumber(pick(raw, "baseTemperatureC"));
  if (!date || (humidityPct === null && precipitationMm === null && temperatureC === null)) {
    return null;
  }
  return { date, humidityPct, precipitationMm, temperatureC };
}

/** Aceita um array puro ou um objeto que embrulhe o array. */
function extractList(payload) {
  if (Array.isArray(payload)) return payload;
  if (isObject(payload)) {
    const key = LIST_KEYS.find((k) => Array.isArray(payload[k]));
    if (key) return payload[key];
  }
  throw formatError("era esperada uma lista");
}

/**
 * Converte a lista, descarta registros inválidos, remove duplicatas
 * (o último de cada data vence) e ordena cronologicamente.
 */
function normalizeList(payload, mapRecord, keyOf) {
  const list = extractList(payload);
  const records = list.map(mapRecord).filter(Boolean);
  if (list.length > 0 && records.length === 0) {
    throw formatError("nenhum registro com os campos esperados");
  }
  const byKey = new Map(records.map((record) => [keyOf(record), record]));
  return [...byKey.values()].sort((a, b) => keyOf(a).localeCompare(keyOf(b)));
}

/** @returns {Forecast[]} resposta de /previsoes */
export const normalizeForecasts = (payload) =>
  normalizeList(payload, mapForecast, (f) => f.targetDate);

/** @returns {Observation[]} resposta de /observacoes */
export const normalizeObservations = (payload) =>
  normalizeList(payload, mapObservation, (o) => o.date);

/**
 * Resposta de /executar: a última previsão.
 * Aceita { ultima_previsao: {...} }, { previsao: {...} } ou o próprio objeto.
 *
 * @returns {{ forecast: Forecast, station: string|null, fetchedAt: Date }}
 */
export function normalizeLatest(payload) {
  if (!isObject(payload)) throw formatError();
  if (payload.ok === false) throw new ApiError("A API informou falha ao processar a previsão.");

  const forecast = mapForecast(payload.ultima_previsao ?? payload.previsao ?? payload);
  if (!forecast) throw formatError("previsão sem data ou temperatura válidas");

  return { forecast, station: toText(payload.estacao, 20), fetchedAt: new Date() };
}
