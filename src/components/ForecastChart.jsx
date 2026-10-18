import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { formatDateShort, formatTemperature } from "../utils/format";
import { LEGEND_OPTIONS, TOOLTIP_OPTIONS } from "./chartSetup";

/** Gradiente roxo sob a linha; precisa da área do gráfico, por isso é "scriptable". */
function areaGradient({ chart }) {
  const { ctx, chartArea } = chart;
  if (!chartArea) return "rgba(139, 92, 246, 0.2)"; // primeiro render, sem layout ainda
  const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
  gradient.addColorStop(0, "rgba(139, 92, 246, 0.5)");
  gradient.addColorStop(1, "rgba(139, 92, 246, 0)");
  return gradient;
}

const OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: LEGEND_OPTIONS,
    tooltip: {
      ...TOOLTIP_OPTIONS,
      callbacks: { label: (item) => ` ${item.dataset.label}: ${formatTemperature(item.parsed.y)}` },
    },
  },
  scales: { y: { beginAtZero: false, suggestedMin: 15, suggestedMax: 35 } },
};

/**
 * Temperatura prevista x temperatura média do dia-base.
 * @param {{ forecasts: import("../services/normalizers").Forecast[] }} props
 */
export default function ForecastChart({ forecasts }) {
  const data = useMemo(() => {
    const datasets = [
      {
        label: "Temp. prevista (°C)",
        data: forecasts.map((f) => f.temperatureC),
        borderColor: "#8b5cf6",
        backgroundColor: areaGradient,
        pointBackgroundColor: "#8b5cf6",
        pointBorderColor: "#fff",
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ];

    // Só desenha a série de base se a API fornecer esse dado.
    if (forecasts.some((f) => f.baseTemperatureC !== null)) {
      datasets.push({
        label: "Temp. média do dia-base (°C)",
        data: forecasts.map((f) => f.baseTemperatureC),
        borderColor: "#3b82f6",
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.4,
        spanGaps: true,
      });
    }

    return { labels: forecasts.map((f) => formatDateShort(f.targetDate)), datasets };
  }, [forecasts]);

  return (
    <div className="chart-container">
      <Line data={data} options={OPTIONS} role="img" aria-label="Temperaturas previstas por data" />
    </div>
  );
}
