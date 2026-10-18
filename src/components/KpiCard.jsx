/**
 * Cartão de indicador (KPI).
 *
 * @param {Object}  props
 * @param {string}  props.title     Título do indicador
 * @param {string}  props.value     Valor principal já formatado
 * @param {string}  [props.subtitle] Texto de apoio
 * @param {boolean} [props.small]   Reduz a fonte do valor (textos longos)
 */
export default function KpiCard({ title, value, subtitle, small = false }) {
  return (
    <article className="kpi-card glass">
      <h3>{title}</h3>
      <div className={small ? "kpi-value kpi-small" : "kpi-value"}>{value}</div>
      {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
    </article>
  );
}
