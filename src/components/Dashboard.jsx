import { useAuth } from "../context/AuthContext";
import { useDashboardData } from "../hooks/useDashboardData";
import {
  formatDateBR,
  formatDateTime,
  formatIssuedDate,
  formatMethod,
  formatPercent,
  formatTemperature,
  isFallbackMethod,
} from "../utils/format";
import ConditionsChart from "./ConditionsChart";
import ForecastChart from "./ForecastChart";
import HistoryTable from "./HistoryTable";
import KpiCard from "./KpiCard";

/** Conteúdo de um cartão: gráfico/tabela, "carregando" ou "sem dados". */
function CardBody({ hasData, isLoading, children }) {
  if (hasData) return children;
  return <p className="empty">{isLoading ? "Carregando..." : "Sem dados para exibir."}</p>;
}

/**
 * Tela principal: KPIs, dois gráficos e tabela de previsões.
 * Toda a lógica de dados está em `useDashboardData`; aqui só há apresentação.
 */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const { current, forecasts, observations, station, fetchedAt, errors, isLoading, reload } =
    useDashboardData();

  return (
    <div className="container">
      <header>
        <h1>
          Previsão do Tempo <span className="highlight">D+1</span>
        </h1>
        <p>Estação INMET {station || "A707"} - Presidente Prudente/SP</p>

        <div className="toolbar">
          <span className="toolbar-user">Sessão: {user}</span>
          <button type="button" className="btn" onClick={reload} disabled={isLoading}>
            {isLoading ? "Consultando..." : "Atualizar"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={logout}>
            Sair
          </button>
        </div>
      </header>

      <main>
        {/* Avisos: erros nunca são silenciosos; cada rota falha de forma independente. */}
        {errors.map((message) => (
          <div key={message} className="alert alert-error" role="alert">
            {message}
          </div>
        ))}
        {isLoading && !current && (
          <div className="alert" role="status">
            Consultando a API... na primeira consulta o servidor pode levar até 1 minuto para acordar.
          </div>
        )}
        {current && isFallbackMethod(current.method) && (
          <div className="alert alert-warning" role="status">
            Esta previsão usou <strong>{formatMethod(current.method)}</strong> porque não havia
            observação real do dia-base. A confiabilidade é menor que a de uma previsão com dados
            observados.
          </div>
        )}

        <section className="kpi-grid" aria-label="Indicadores">
          <KpiCard
            title="Previsão para amanhã"
            value={formatTemperature(current?.temperatureC)}
            subtitle={`Data alvo: ${formatDateBR(current?.targetDate)}`}
          />
          <KpiCard
            title="Temperatura base (média)"
            value={formatTemperature(current?.baseTemperatureC)}
            subtitle={`Data base: ${formatDateBR(current?.baseDate)}`}
          />
          <KpiCard
            title="Umidade média (base)"
            value={formatPercent(current?.humidityPct)}
            subtitle="Observada"
          />
          <KpiCard
            title="Última atualização"
            value={current?.issuedAt ? formatIssuedDate(current.issuedAt) : formatDateTime(fetchedAt)}
            subtitle={`Entrada: ${formatMethod(current?.method)}`}
            small
          />
        </section>

        <section className="charts-grid">
          <div className="chart-card glass">
            <h2>Histórico de previsões (recentes)</h2>
            <CardBody hasData={forecasts.length > 0} isLoading={isLoading}>
              <ForecastChart forecasts={forecasts} />
            </CardBody>
          </div>

          <div className="chart-card glass">
            <h2>Condições climáticas recentes</h2>
            <CardBody hasData={observations.length > 0} isLoading={isLoading}>
              <ConditionsChart observations={observations} />
            </CardBody>
          </div>

          <div className="chart-card chart-card-wide glass">
            <h2>Previsões emitidas</h2>
            <CardBody hasData={forecasts.length > 0} isLoading={isLoading}>
              <HistoryTable forecasts={forecasts} />
            </CardBody>
          </div>
        </section>
      </main>

      <footer>
        <p>
          Dashboard Operacional - Desenvolvido como Projeto Integrador IV. Dados fornecidos pelo
          INMET.
        </p>
      </footer>
    </div>
  );
}
