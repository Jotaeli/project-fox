import { fmtBRL } from "../../../lib/currentMonth.js";

export function DonutChart({ rows }: { rows: { nome: string; cor: string; total: number }[] }) {
  const active = rows.filter((r) => r.total > 0);
  const grandTotal = active.reduce((s, r) => s + r.total, 0);

  if (!grandTotal) {
    return (
      <div className="chart-panel">
        <div className="sec-label">Gastos por modalidade</div>
        <div className="chart-row">
          <div className="chart-ring" style={{ background: "conic-gradient(rgba(148,180,255,.12) 0% 100%)" }}>
            <div className="chart-hole"><span>—</span></div>
          </div>
          <div className="chart-legend"><div className="chart-empty">Nenhum gasto planejado ainda.</div></div>
        </div>
      </div>
    );
  }

  let acc = 0;
  const stops = active.map((r) => {
    const from = acc;
    acc += (r.total / grandTotal) * 100;
    return `${r.cor} ${from}% ${acc}%`;
  }).join(", ");

  const legendRows = [...active].sort((a, b) => b.total - a.total);

  return (
    <div className="chart-panel">
      <div className="sec-label">Gastos por modalidade</div>
      <div className="chart-row">
        <div className="chart-ring" style={{ background: `conic-gradient(${stops})` }}>
          <div className="chart-hole"><span>{fmtBRL(grandTotal)}</span></div>
        </div>
        <div className="chart-legend">
          {legendRows.map((r) => (
            <div className="mc-row" key={r.nome}>
              <span className="mc-dot" style={{ background: r.cor }} />
              <span className="mc-name">{r.nome}</span>
              <span className="mc-pct">{Math.round((r.total / grandTotal) * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
