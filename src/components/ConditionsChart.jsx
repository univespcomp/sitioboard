import { useMemo } from "react";
import { Chart } from "react-chartjs-2";
import { formatDateShort } from "../utils/format";
import { LEGEND_OPTIONS, TOOLTIP_OPTIONS } from "./chartSetup";

const OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: LEGEND_OPTIONS, tooltip: TOOLTIP_OPTIONS },
  scales: {
    y: {
      type: "linear",
      position: "left",
      beginAtZero: true,
      max: 100,
      title: { display: true, text: "Umidade (%)", color: "#94a3b8" },
    },
    y1: {
      type: "linear",
      position: "right",
      beginAtZero: true,
      suggestedMax: 50,
      grid: { drawOnChartArea: false },
      title: { display: true, text: "Chuva (mm)", color: "#94a3b8" },
    },
  },
};

/**
 * Chuva (barras) e umidade média (linha) dos últimos dias observados.
 * @param {{ observations: import("../services/normalizers").Observation[] }} props
 */
export default function ConditionsChart({ observations }) {
  const data = useMemo(
    () => ({
      labels: observations.map((o) => formatDateShort(o.date)),
      datasets: [
        {
          type: "bar",
          label: "Precipitação (mm)",
          data: observations.map((o) => o.precipitationMm),
          backgroundColor: "rgba(59, 130, 246, 0.7)",
          borderColor: "#3b82f6",
          borderWidth: 1,
          yAxisID: "y1",
        },
        {
          type: "line",
          label: "Umidade média (%)",
          data: observations.map((o) => o.humidityPct),
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 2,
          pointRadius: 2,
          fill: true,
          tension: 0.4,
          spanGaps: true,
          yAxisID: "y",
        },
      ],
    }),
    [observations],
  );

  return (
    <div className="chart-container">
      <Chart
        type="bar"
        data={data}
        options={OPTIONS}
        role="img"
        aria-label="Precipitação e umidade média por data"
      />
    </div>
  );
}
