import { useCallback, useEffect, useMemo, useState } from "react";
import { MAX_CHART_POINTS } from "../config/constants";
import { ApiError } from "../services/apiClient";
import { fetchForecasts, fetchLatestForecast, fetchObservations } from "../services/weatherApi";

/**
 * Carrega UM recurso da API e expõe { status, data, error }.
 * `fetcher` deve ser uma função estável (definida fora do componente).
 */
function useApiResource(fetcher, reloadKey) {
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  useEffect(() => {
    const controller = new AbortController();
    setState((prev) => ({ ...prev, status: "loading", error: null }));

    fetcher({ signal: controller.signal })
      .then((data) => setState({ status: "success", data, error: null }))
      .catch((error) => {
        if (controller.signal.aborted) return; // componente desmontado / recarga
        const message =
          error instanceof ApiError ? error.userMessage : "Erro inesperado ao carregar os dados.";
        // Mantém os dados antigos na tela caso a recarga falhe.
        setState((prev) => ({ ...prev, status: "error", error: message }));
      });

    return () => controller.abort();
  }, [fetcher, reloadKey]);

  return state;
}

/**
 * Monta a previsão "atual" combinando as fontes. Prioridade: /executar;
 * campos ausentes são completados pela previsão correspondente em /previsoes
 * e pela última observação. Se /executar falhar, usa a última de /previsoes.
 *
 * @returns {import("../services/normalizers").Forecast | null}
 */
function buildCurrentForecast(latest, forecasts, observations) {
  const lastListed = forecasts?.at(-1) ?? null;
  const primary = latest?.forecast ?? lastListed;
  if (!primary) return null;

  const listedMatch = forecasts?.find((f) => f.targetDate === primary.targetDate) ?? lastListed;
  const lastObservation = observations?.at(-1) ?? null;
  const merged = Object.fromEntries(
    Object.entries(primary).map(([key, value]) => [key, value ?? listedMatch?.[key] ?? null]),
  );

  return {
    ...merged,
    baseTemperatureC: merged.baseTemperatureC ?? lastObservation?.temperatureC ?? null,
    humidityPct: merged.humidityPct ?? lastObservation?.humidityPct ?? null,
  };
}

/**
 * Hook principal do dashboard. As 3 rotas são independentes: se uma falhar,
 * o restante continua sendo exibido e o erro aparece num aviso.
 *
 * Não há polling automático: /executar pode disparar processamento no
 * servidor, então só consultamos ao abrir a tela e quando o usuário clica
 * em "Atualizar". (Em desenvolvimento, o StrictMode do React monta duas
 * vezes e a primeira requisição é cancelada — comportamento esperado.)
 */
export function useDashboardData() {
  const [reloadKey, setReloadKey] = useState(0);
  const latest = useApiResource(fetchLatestForecast, reloadKey);
  const forecasts = useApiResource(fetchForecasts, reloadKey);
  const observations = useApiResource(fetchObservations, reloadKey);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  const current = useMemo(
    () => buildCurrentForecast(latest.data, forecasts.data, observations.data),
    [latest.data, forecasts.data, observations.data],
  );

  const recentForecasts = useMemo(
    () => (forecasts.data ?? []).slice(-MAX_CHART_POINTS),
    [forecasts.data],
  );
  const recentObservations = useMemo(
    () => (observations.data ?? []).slice(-MAX_CHART_POINTS),
    [observations.data],
  );

  const errors = [
    latest.error && `Previsão atual: ${latest.error}`,
    forecasts.error && `Previsões: ${forecasts.error}`,
    observations.error && `Observações: ${observations.error}`,
  ].filter(Boolean);

  return {
    current,
    forecasts: recentForecasts,
    observations: recentObservations,
    station: latest.data?.station ?? null,
    fetchedAt: latest.data?.fetchedAt ?? null,
    errors,
    isLoading: [latest, forecasts, observations].some((r) => r.status === "loading"),
    reload,
  };
}
