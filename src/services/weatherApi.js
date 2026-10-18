import { ENDPOINTS } from "../config/constants";
import { getJson } from "./apiClient";
import { normalizeForecasts, normalizeLatest, normalizeObservations } from "./normalizers";

/**
 * Funções de acesso às rotas da API. Cada uma = GET + validação.
 * Todas aceitam `{ signal }` para cancelamento.
 */

/** GET /executar — última previsão. */
export const fetchLatestForecast = (options) =>
  getJson(ENDPOINTS.latest, options).then(normalizeLatest);

/** GET /previsoes — previsões emitidas (ordem cronológica). */
export const fetchForecasts = (options) =>
  getJson(ENDPOINTS.forecasts, options).then(normalizeForecasts);

/** GET /observacoes — histórico de observações (ordem cronológica). */
export const fetchObservations = (options) =>
  getJson(ENDPOINTS.observations, options).then(normalizeObservations);
