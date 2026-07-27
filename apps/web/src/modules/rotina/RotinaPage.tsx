import { useSearchParams } from "react-router-dom";
import { useRegisterGuide } from "../../guides/GuideContext.js";
import { currentMonthLabel } from "../../lib/currentMonth.js";
import { FinancasTab } from "./financas/FinancasTab.js";
import "./rotina.css";
import { TarefasTab } from "./tarefas/TarefasTab.js";
import { WishlistTab } from "./wishlist/WishlistTab.js";

type SubTab = "wishlist" | "tarefas" | "financas";
const VALID_TABS: SubTab[] = ["wishlist", "tarefas", "financas"];

export function RotinaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const fromParam = searchParams.get("tab") as SubTab | null;
  const tab: SubTab = fromParam && VALID_TABS.includes(fromParam) ? fromParam : "wishlist";
  useRegisterGuide(`rotina-${tab}` as const);

  function selectTab(next: SubTab) {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("tab", next);
      return p;
    });
  }

  return (
    <div>
      <div className="rotina-topbar">
        <nav className="rotina-subtabs">
          <button className={`rotina-subtab${tab === "wishlist" ? " sel" : ""}`} onClick={() => selectTab("wishlist")}>Wishlist</button>
          <button className={`rotina-subtab${tab === "tarefas" ? " sel" : ""}`} onClick={() => selectTab("tarefas")}>Tarefas</button>
          <button className={`rotina-subtab${tab === "financas" ? " sel" : ""}`} onClick={() => selectTab("financas")}>Finanças</button>
        </nav>
        <span className="month-chip">{currentMonthLabel()}</span>
      </div>
      {tab === "wishlist" && <WishlistTab />}
      {tab === "tarefas" && <TarefasTab />}
      {tab === "financas" && <FinancasTab />}
    </div>
  );
}
