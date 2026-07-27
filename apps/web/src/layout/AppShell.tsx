import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.js";
import { useGuideControls } from "../guides/GuideContext.js";
import { supabase } from "../lib/supabaseClient.js";
import { HelpIcon, LogoutIcon } from "../icons/index.js";
import "./layout.css";

export function AppShell() {
  const { session } = useAuth();
  const { activeKey, openGuide } = useGuideControls();

  return (
    <div className="app-shell">
      <header className="topbar">
        <h1>Project Fox</h1>
        <nav className="subtabs">
          <NavLink to="/" end className={({ isActive }) => `subtab${isActive ? " sel" : ""}`}>Início</NavLink>
          <NavLink to="/rotina" className={({ isActive }) => `subtab${isActive ? " sel" : ""}`}>Rotina</NavLink>
          <NavLink to="/anotar" className={({ isActive }) => `subtab${isActive ? " sel" : ""}`}>Anotar</NavLink>
          <NavLink to="/criar" className={({ isActive }) => `subtab${isActive ? " sel" : ""}`}>Desenvolver/Criar</NavLink>
        </nav>
        <div className="topbar-right">
          <span className="user-email">{session?.user.email}</span>
          <button
            className="icon-btn help-btn" title="Como usar esta aba"
            onClick={openGuide} disabled={!activeKey}
          >
            <HelpIcon />
          </button>
          <button className="icon-btn" title="Sair" onClick={() => supabase.auth.signOut()}>
            <LogoutIcon />
          </button>
        </div>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
