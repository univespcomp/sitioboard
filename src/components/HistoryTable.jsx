import { MAX_TABLE_ROWS } from "../config/constants";
import { formatDateBR, formatMethod, formatTemperature } from "../utils/format";

/**
 * Tabela com as previsões mais recentes (mais nova primeiro).
 * @param {{ forecasts: import("../services/normalizers").Forecast[] }} props
 */
export default function HistoryTable({ forecasts }) {
  const rows = [...forecasts].reverse().slice(0, MAX_TABLE_ROWS);

  return (
    <div className="table-scroll">
      <table className="history-table">
        <thead>
          <tr>
            <th scope="col">Data prevista</th>
            <th scope="col">Data base</th>
            <th scope="col">Prevista</th>
            <th scope="col">Média do dia-base</th>
            <th scope="col">Método</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((f) => (
            <tr key={f.targetDate}>
              <td>{formatDateBR(f.targetDate)}</td>
              <td>{formatDateBR(f.baseDate)}</td>
              <td>{formatTemperature(f.temperatureC)}</td>
              <td>{formatTemperature(f.baseTemperatureC)}</td>
              <td>{formatMethod(f.method)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
