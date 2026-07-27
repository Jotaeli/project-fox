import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { currentMonthLabel } from "../../lib/currentMonth.js";
import { FinancasTab } from "./financas/FinancasTab.js";
import "./rotina.css";
import { TarefasTab } from "./tarefas/TarefasTab.js";
import { WishlistTab } from "./wishlist/WishlistTab.js";

type SubTab = "wishlist" | "tarefas" | "financas";
const VALID_TABS: SubTab[] = ["wishlist", "tarefas", "financas"];

export function RotinaPage() {
  const [searchParams] = useSearchParams();
  const fromParam = searchParams.get("tab") as SubTab | null;
  const [tab, setTab] = useState<SubTab>(fromParam && VALID_TABS.includes(fromParam) ? fromParam : "wishlist");

  return (
    <div>
      <div className="rotina-topbar">
        <nav className="rotina-subtabs">
          <button className={`rotina-subtab${tab === "wishlist" ? " sel" : ""}`} onClick={() => setTab("wishlist")}>Wishlist</button>
          <button className={`rotina-subtab${tab === "tarefas" ? " sel" : ""}`} onClick={() => setTab("tarefas")}>Tarefas</button>
          <button className={`rotina-subtab${tab === "financas" ? " sel" : ""}`} onClick={() => setTab("financas")}>Finanças</button>
        </nav>
        <span className="month-chip">{currentMonthLabel()}</span>
      </div>
      {tab === "wishlist" && <WishlistTab />}
      {tab === "tarefas" && <TarefasTab />}
      {tab === "financas" && <FinancasTab />}
    </div>
  );
}
