import { AlertIcon, ChecklistIcon, ClockIcon, PlanetIcon } from "../../icons/index.js";
import type { UrgentItem } from "./useHome.js";

const MOD_ICON = { tarefa: ChecklistIcon, evento: PlanetIcon };
const MOD_LABEL = { tarefa: "Tarefas", evento: "Criar" };

export function UrgentStrip({ items, onSelect }: { items: UrgentItem[]; onSelect: (item: UrgentItem) => void }) {
  return (
    <>
      <div className="sec-head">
        <AlertIcon className="ico" />
        <h2>Precisa de atenção</h2>
        <span className="count">{items.length}</span>
      </div>
      <div className="urgent-strip">
        {items.length === 0 && <div className="urgent-empty">Nada urgente por enquanto — respira.</div>}
        {items.map((item, i) => {
          const ModIcon = MOD_ICON[item.tipo];
          return (
            <div
              key={item.id}
              className={`u-card u-${item.urgencia || "none"}${item.urgencia === "urgent" || item.urgencia === "atrasado" ? " pulse" : ""}`}
              style={{ animationDelay: `${i * 70}ms` }}
              onClick={() => onSelect(item)}
            >
              <div className="u-top">
                <span className="u-mod"><ModIcon /> {MOD_LABEL[item.tipo]}</span>
                <span className="u-due"><ClockIcon /> {item.diasLabel}</span>
              </div>
              <div className="u-title">{item.titulo}</div>
              <div className="u-sub">{item.sub}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}
