import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightIcon, CoinIcon, GridIcon, ImageIcon, PlanetIcon, PlusIcon } from "../../icons/index.js";
import { useRegisterGuide } from "../../guides/GuideContext.js";
import { fmtBRL } from "../../lib/currentMonth.js";
import { BADGES } from "../anotar/AnotarPage.js";
import { hueOf } from "../criar/criarConstants.js";
import { PlanetModal } from "../criar/PlanetModal.js";
import { Piggy } from "../rotina/financas/Piggy.js";
import { TaskModal } from "../rotina/tarefas/TaskModal.js";
import { UrgentStrip } from "./UrgentStrip.js";
import "./home.css";
import { useHome, type UrgentItem } from "./useHome.js";

const ORBITS = [
  { size: 150, dur: "26s" },
  { size: 250, dur: "40s" },
  { size: 360, dur: "60s" },
];

export function HomePage() {
  useRegisterGuide("home");
  const navigate = useNavigate();
  const data = useHome();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [planetModalOpen, setPlanetModalOpen] = useState(false);

  const hour = new Date().getHours();
  const saudacao = hour < 5 ? "Boa madrugada" : hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";
  const dataExtenso = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  function handleUrgentSelect(item: UrgentItem) {
    if (item.tipo === "tarefa") navigate("/rotina?tab=tarefas");
    else navigate(item.planetaId ? `/criar?planeta=${item.planetaId}` : "/criar");
  }

  return (
    <div className="home-wrap">
      <div className="home-hero">
        <div>
          <div className="home-greet">{saudacao}, <b>{data.primeiroNome}</b></div>
          <div className="home-date">{dataExtenso}</div>
        </div>
        <div className="home-quick">
          <button className="btn" onClick={() => setTaskModalOpen(true)}><PlusIcon /> Nova tarefa</button>
          <button className="btn" onClick={() => navigate("/rotina?tab=financas")}><PlusIcon /> Novo gasto</button>
          <button className="btn" onClick={() => navigate("/anotar")}><PlusIcon /> Nova nota</button>
          <button className="btn" onClick={() => setPlanetModalOpen(true)}><PlusIcon /> Novo planeta</button>
        </div>
      </div>

      <UrgentStrip items={data.urgentes} onSelect={handleUrgentSelect} />

      <div className="sec-head">
        <GridIcon className="ico" />
        <h2>Sua vitrine</h2>
      </div>

      <div className="home-vitrine">
        <div className="home-card home-c-cofrinho" style={{ animationDelay: ".05s" }} onClick={() => navigate("/rotina?tab=financas")}>
          <div className="home-card-head">
            <span className="home-card-tag" style={{ color: "var(--gold)" }}><span className="dot" /> Finanças</span>
            <span className="home-card-link">ver módulo <ArrowRightIcon /></span>
          </div>
          <div className="home-cofrinho-body">
            <Piggy avail={data.cofrinho.avail} total={data.cofrinho.totalIncome} spent={data.cofrinho.totalSpent} />
          </div>
          {data.cofrinhoLegenda.length > 0 && (
            <div className="home-cofrinho-legend">
              {data.cofrinhoLegenda.map((m) => (
                <div className="home-cl-item" key={m.nome}>
                  <span className="home-cl-dot" style={{ background: m.cor }} /> {m.nome} <b>{fmtBRL(m.total)}</b>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="home-card home-c-planetas" style={{ animationDelay: ".12s" }} onClick={() => navigate("/criar")}>
          <div className="home-card-head">
            <span className="home-card-tag" style={{ color: "#c9b6ff" }}><span className="dot" /> Desenvolver · Criar</span>
            <span className="home-card-link">ver módulo <ArrowRightIcon /></span>
          </div>
          {data.planetasPreview.length === 0 ? (
            <div className="home-planetas-empty">Nenhum planeta ainda</div>
          ) : (
            <div className="home-space">
              <div className="home-stars" />
              <div className="home-sun" />
              {data.planetasPreview.map((p, i) => {
                const orbit = ORBITS[i % ORBITS.length];
                const hue = hueOf(p.cor);
                const sat = 12 + 68 * p.saude;
                const excitado = data.planetasComEventoAtivo.has(p.id);
                return (
                  <div
                    className="home-orbit"
                    key={p.id}
                    style={{ width: orbit.size, height: orbit.size, animationDuration: excitado ? `${parseFloat(orbit.dur) * 0.8}s` : orbit.dur }}
                  >
                    <div className="home-planet-slot">
                      <div
                        className="home-p-ring"
                        style={{
                          "--hc": `hsl(${hue},${sat}%,58%)`, "--hp": Math.round(p.saude * 100),
                          "--hglow": `hsla(${hue},${sat}%,58%,.5)`, "--rev": orbit.dur,
                        } as React.CSSProperties}
                      >
                        <div className={`home-planet home-tp-${p.tipo}${excitado ? " excited" : ""}`} style={{ "--ph": hue, "--sz": `${26 + i * 4}px` } as React.CSSProperties} />
                        <div className="home-planet-lbl">{p.nome}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="home-p-health-legend">
                {data.planetasPreview.map((p) => (
                  <div className="home-phl" key={p.id}>
                    <span className="home-pd" style={{ color: `hsl(${hueOf(p.cor)},${12 + 68 * p.saude}%,58%)` }} /> {p.nome} <b>{Math.round(p.saude * 100)}%</b>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="home-card home-c-wish" style={{ animationDelay: ".19s" }} onClick={() => navigate("/rotina?tab=wishlist")}>
          <div className="home-card-head">
            <span className="home-card-tag" style={{ color: "var(--green)" }}><span className="dot" /> Wishlist</span>
            <span className="home-card-link">ver módulo <ArrowRightIcon /></span>
          </div>
          {!data.wishDestaque || !data.wishTierInfo ? (
            <div className="home-wish-empty">Nada na wishlist ainda</div>
          ) : (
            <div className="home-loot">
              <div className="home-loot-tier">{data.wishDestaque.tier} · {data.wishTierInfo.name}</div>
              <div className="home-loot-photo">
                {data.wishDestaque.foto ? <img src={data.wishDestaque.foto} alt="" /> : <ImageIcon />}
              </div>
              <div className="home-loot-info">
                <div className="home-loot-name">{data.wishDestaque.nome}</div>
                <div className="home-loot-price"><CoinIcon /> {fmtBRL(data.wishDestaque.valor)}</div>
                <div className="home-loot-chips">
                  {data.wishDestaquePlaneta && <span className="chip planet"><PlanetIcon /> {data.wishDestaquePlaneta}</span>}
                  {data.wishTemMetaAtiva && <span className="chip money">meta ativa</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="home-card home-c-notas" style={{ animationDelay: ".26s" }} onClick={() => navigate("/anotar")}>
          <div className="home-card-head">
            <span className="home-card-tag" style={{ color: "#cdd8ff" }}><span className="dot" /> Anotar</span>
            <span className="home-card-link">ver módulo <ArrowRightIcon /></span>
          </div>
          {data.notasRecentes.length === 0 ? (
            <div className="home-notas-empty">Nenhuma nota ainda</div>
          ) : (
            <div className="home-notas-list">
              {data.notasRecentes.map((n) => {
                const core = n.cores[0];
                const halo = n.cores.map((c, i) => `0 0 ${10 + i * 6}px rgba(${c[0]},${c[1]},${c[2]},.55)`).join(", ");
                return (
                  <div className="home-note-row" key={n.id}>
                    <span className="home-note-orb" style={{ background: `rgba(${core[0]},${core[1]},${core[2]},.9)`, boxShadow: halo }} />
                    <div className="home-note-body">
                      <div className="home-note-title">{n.titulo}</div>
                      <div className="home-note-badges">
                        {(n.badges.length ? n.badges : (["indep"] as const)).map((b, i) => {
                          const c = b === "indep" ? [205, 220, 255] : BADGES[b].rgb;
                          return <span className="home-nb" key={i} style={{ background: `rgba(${c[0]},${c[1]},${c[2]},.9)`, color: `rgba(${c[0]},${c[1]},${c[2]},.9)` }} />;
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {taskModalOpen && (
        <TaskModal secoes={data.secoes} defaultSecaoId={data.secoes.find((s) => s.fixa)?.id ?? data.secoes[0]?.id ?? ""} onClose={() => setTaskModalOpen(false)} />
      )}
      {planetModalOpen && (
        <PlanetModal onClose={() => setPlanetModalOpen(false)} onCreated={() => { setPlanetModalOpen(false); navigate("/criar"); }} />
      )}
    </div>
  );
}
