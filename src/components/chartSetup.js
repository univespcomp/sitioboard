import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";

/**
 * Registro único do Chart.js (importe este módulo nos componentes de gráfico).
 * Registramos só o necessário para manter o bundle pequeno.
 */
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, Filler, Tooltip, Legend,
);

// Tema escuro (mesmos valores do dashboard original).
ChartJS.defaults.color = "#94a3b8";
ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.scale.grid.color = "rgba(255, 255, 255, 0.05)";

export const LEGEND_OPTIONS = { position: "top", labels: { boxWidth: 12, usePointStyle: true } };

export const TOOLTIP_OPTIONS = {
  backgroundColor: "rgba(15, 23, 42, 0.9)",
  titleColor: "#fff",
  bodyColor: "#cbd5e1",
  borderColor: "rgba(255,255,255,0.1)",
  borderWidth: 1,
  padding: 10,
};
