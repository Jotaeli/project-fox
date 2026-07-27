// Ilustrações dos guias (Fase 4.6).
// Coloridas de propósito — são o único lugar do app com arte cheia, não ícones de linha.
// Todas em viewBox 0 0 320 168, desenhadas para o topo do GuideModal.

const VB = "0 0 320 168";

function Stars({ n = 22, seed = 1 }: { n?: number; seed?: number }) {
  const dots = Array.from({ length: n }, (_, i) => {
    const a = Math.sin((i + seed) * 12.9898) * 43758.5453;
    const b = Math.sin((i + seed) * 78.233) * 12345.6789;
    return { x: (a - Math.floor(a)) * 320, y: (b - Math.floor(b)) * 168, r: 0.6 + ((i * 7) % 3) * 0.35 };
  });
  return (
    <g>
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#9dc0ff" opacity={0.15 + (i % 4) * 0.12} />
      ))}
    </g>
  );
}

export function HomeWelcomeArt() {
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={30} seed={3} />
      <g transform="translate(160 92)">
        <ellipse cx="0" cy="52" rx="72" ry="9" fill="#6ea8ff" opacity=".12" />
        {/* orelhas */}
        <path d="M-44-30 -30-64 -10-40Z" fill="#e8763a" />
        <path d="M44-30 30-64 10-40Z" fill="#e8763a" />
        <path d="M-38-33 -29-53 -17-39Z" fill="#2b1a2e" opacity=".65" />
        <path d="M38-33 29-53 17-39Z" fill="#2b1a2e" opacity=".65" />
        {/* cabeça */}
        <path d="M-48-34C-20-46 20-46 48-34 52-4 30 34 0 44-30 34-52-4-48-34Z" fill="#f0873f" />
        <path d="M-24-6C-14 24 14 24 24-6 14 22-14 22-24-6Z" fill="#fff" opacity=".9" />
        <path d="M0 44C-22 36-38 16-44-8-26 24 26 24 44-8 38 16 22 36 0 44Z" fill="#fdf3e6" />
        {/* olhos */}
        <ellipse cx="-19" cy="-8" rx="5.5" ry="6.5" fill="#20142a" />
        <ellipse cx="19" cy="-8" rx="5.5" ry="6.5" fill="#20142a" />
        <circle cx="-17" cy="-10.5" r="1.8" fill="#fff" />
        <circle cx="21" cy="-10.5" r="1.8" fill="#fff" />
        {/* focinho */}
        <path d="M0 16 -6 8h12Z" fill="#20142a" />
        <path d="M0 16v7" stroke="#20142a" strokeWidth="2" strokeLinecap="round" />
      </g>
      <circle cx="52" cy="40" r="3" fill="#ffd66e" />
      <circle cx="272" cy="52" r="2.4" fill="#f472b6" />
      <circle cx="248" cy="26" r="2" fill="#4ade80" />
    </svg>
  );
}

export function HomeUrgentArt() {
  const chips = [
    { x: 22, c: "#f87171", w: 82, label: 62 },
    { x: 116, c: "#ffd66e", w: 82, label: 54 },
    { x: 210, c: "#4ade80", w: 82, label: 58 },
  ];
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={14} seed={7} />
      <text x="22" y="34" fill="#8fa3c8" fontSize="10" letterSpacing="1.4">PRECISA DE VOCÊ AGORA</text>
      {chips.map((c, i) => (
        <g key={i}>
          <rect x={c.x} y="48" width={c.w} height="62" rx="12" fill="#101c3c" stroke={c.c} strokeOpacity=".5" />
          <rect x={c.x} y="48" width={c.w} height="62" rx="12" fill={c.c} opacity=".08" />
          <circle cx={c.x + 15} cy="66" r="5" fill={c.c} />
          <rect x={c.x + 26} y="62" width={c.label - 26} height="6" rx="3" fill="#dce6ff" opacity=".65" />
          <rect x={c.x + 14} y="80" width={c.w - 34} height="5" rx="2.5" fill="#8fa3c8" opacity=".45" />
          <rect x={c.x + 14} y="92" width="40" height="12" rx="6" fill={c.c} opacity=".22" />
          <text x={c.x + 22} y="101" fill={c.c} fontSize="8">{["hoje", "3 dias", "2 sem"][i]}</text>
        </g>
      ))}
      <text x="22" y="134" fill="#8fa3c8" fontSize="9.5">vermelho · amarelo · verde — conforme o prazo aperta</text>
    </svg>
  );
}

export function HomeShowcaseArt() {
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={12} seed={11} />
      {/* cofrinho */}
      <rect x="22" y="24" width="130" height="72" rx="14" fill="#101c3c" stroke="#94b4ff" strokeOpacity=".18" />
      <ellipse cx="72" cy="62" rx="30" ry="24" fill="#f2a0c0" />
      <path d="M52 44 46 32l16 6Z" fill="#f2a0c0" />
      <ellipse cx="74" cy="62" rx="17" ry="13" fill="#0a1230" opacity=".7" />
      <circle cx="68" cy="66" r="4" fill="#ffd66e" />
      <circle cx="78" cy="64" r="4" fill="#ffd66e" />
      <circle cx="73" cy="57" r="4" fill="#ffd66e" />
      <rect x="112" y="44" width="30" height="6" rx="3" fill="#ffd66e" opacity=".7" />
      <rect x="112" y="58" width="22" height="5" rx="2.5" fill="#8fa3c8" opacity=".5" />
      <rect x="112" y="70" width="26" height="5" rx="2.5" fill="#8fa3c8" opacity=".5" />
      {/* mini sistema solar */}
      <rect x="164" y="24" width="134" height="72" rx="14" fill="#101c3c" stroke="#94b4ff" strokeOpacity=".18" />
      <circle cx="231" cy="60" r="8" fill="#ffd66e" />
      <circle cx="231" cy="60" r="8" fill="#fff" opacity=".25" />
      <ellipse cx="231" cy="60" rx="26" ry="19" fill="none" stroke="#94b4ff" strokeOpacity=".25" />
      <ellipse cx="231" cy="60" rx="44" ry="30" fill="none" stroke="#94b4ff" strokeOpacity=".16" />
      <circle cx="257" cy="60" r="5" fill="#69d68a" />
      <circle cx="205" cy="48" r="4" fill="#c9a0ff" />
      <circle cx="275" cy="76" r="4.5" fill="#6ea8ff" />
      {/* wishlist + notas */}
      <rect x="22" y="106" width="86" height="46" rx="12" fill="#101c3c" stroke="#ffd66e" strokeOpacity=".3" />
      <rect x="32" y="116" width="26" height="26" rx="7" fill="#ffd66e" opacity=".3" />
      <rect x="64" y="120" width="34" height="6" rx="3" fill="#ffd66e" opacity=".8" />
      <rect x="64" y="132" width="24" height="5" rx="2.5" fill="#8fa3c8" opacity=".5" />
      <rect x="120" y="106" width="178" height="46" rx="12" fill="#101c3c" stroke="#94b4ff" strokeOpacity=".18" />
      <circle cx="142" cy="129" r="7" fill="#4ade80" />
      <circle cx="180" cy="129" r="7" fill="#60a5fa" />
      <circle cx="218" cy="129" r="7" fill="#f472b6" />
      <circle cx="256" cy="129" r="7" fill="#dce6ff" opacity=".8" />
      <path d="M149 129h24M187 129h24M225 129h24" stroke="#94b4ff" strokeOpacity=".35" strokeWidth="1.5" />
    </svg>
  );
}

export function PiggyArt() {
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={12} seed={5} />
      <ellipse cx="160" cy="142" rx="82" ry="10" fill="#f472b6" opacity=".12" />
      <g transform="translate(160 84)">
        <path d="M-42-46 -56-70l30 10Z" fill="#f2a0c0" />
        <ellipse cx="0" cy="0" rx="70" ry="52" fill="#f2a0c0" />
        <ellipse cx="0" cy="0" rx="70" ry="52" fill="#fff" opacity=".12" />
        <rect x="-58" y="40" width="18" height="18" rx="5" fill="#e488ac" />
        <rect x="40" y="40" width="18" height="18" rx="5" fill="#e488ac" />
        <ellipse cx="62" cy="-4" rx="14" ry="16" fill="#e488ac" />
        <ellipse cx="66" cy="-4" rx="7" ry="9" fill="#c96f92" />
        <circle cx="63.5" cy="-7" r="1.8" fill="#8d4a66" />
        <circle cx="63.5" cy="-1" r="1.8" fill="#8d4a66" />
        <circle cx="34" cy="-20" r="4" fill="#3a1c2b" />
        <rect x="-16" y="-52" width="34" height="6" rx="3" fill="#8d4a66" opacity=".55" />
        {/* janela de vidro */}
        <ellipse cx="-8" cy="4" rx="38" ry="30" fill="#050c22" opacity=".82" />
        <ellipse cx="-8" cy="4" rx="38" ry="30" fill="none" stroke="#ffd66e" strokeOpacity=".45" strokeWidth="1.5" />
        <ellipse cx="-8" cy="4" rx="38" ry="30" fill="url(#glass)" opacity=".3" />
        {[[-24, 18], [-8, 20], [8, 17], [-30, 5], [-14, 8], [2, 6], [16, 4], [-20, -6], [-4, -4], [10, -8]].map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r="6.5" fill="#ffd66e" />
            <circle cx={x - 1.5} cy={y - 1.8} r="2" fill="#fff3c9" />
          </g>
        ))}
      </g>
      <defs>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dce6ff" stopOpacity=".5" />
          <stop offset="1" stopColor="#dce6ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g transform="translate(262 142)">
        <rect x="-34" y="-16" width="68" height="30" rx="10" fill="#0d1630" stroke="#94b4ff" strokeOpacity=".25" />
        <text x="0" y="4" fill="#ffd66e" fontSize="14" fontWeight="700" textAnchor="middle">R$ 1.240</text>
      </g>
    </svg>
  );
}

export function DonutArt() {
  const segs = [
    { c: "#ffd66e", from: 0, to: 0.34 },
    { c: "#f472b6", from: 0.34, to: 0.58 },
    { c: "#60a5fa", from: 0.58, to: 0.8 },
    { c: "#4ade80", from: 0.8, to: 1 },
  ];
  const R = 46, CX = 96, CY = 84;
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={10} seed={13} />
      {segs.map((s, i) => {
        const a0 = s.from * Math.PI * 2 - Math.PI / 2;
        const a1 = s.to * Math.PI * 2 - Math.PI / 2 - 0.06;
        const large = s.to - s.from > 0.5 ? 1 : 0;
        const d = `M${CX + R * Math.cos(a0)} ${CY + R * Math.sin(a0)}A${R} ${R} 0 ${large} 1 ${CX + R * Math.cos(a1)} ${CY + R * Math.sin(a1)}`;
        return <path key={i} d={d} stroke={s.c} strokeWidth="15" fill="none" strokeLinecap="round" />;
      })}
      <text x={CX} y={CY - 2} fill="#dce6ff" fontSize="15" fontWeight="700" textAnchor="middle">R$ 2.8k</text>
      <text x={CX} y={CY + 14} fill="#8fa3c8" fontSize="9" textAnchor="middle">planejado</text>
      {["Wishlist", "Comida", "Contas", "Rolê"].map((l, i) => (
        <g key={l} transform={`translate(190 ${44 + i * 24})`}>
          <rect x="0" y="-8" width="12" height="12" rx="4" fill={segs[i].c} />
          <text x="20" y="2" fill="#dce6ff" fontSize="11">{l}</text>
          <text x="106" y="2" fill="#8fa3c8" fontSize="10" textAnchor="end">
            {["34%", "24%", "22%", "20%"][i]}
          </text>
        </g>
      ))}
    </svg>
  );
}

const TIER_ART = [
  { t: "S", n: "Obsessão", c: "#ffd66e" },
  { t: "A", n: "Desejo", c: "#f472b6" },
  { t: "B", n: "Curtiria", c: "#60a5fa" },
  { t: "C", n: "Algum dia", c: "#8fa3c8" },
];

export function TiersArt() {
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={10} seed={17} />
      {TIER_ART.map((t, i) => (
        <g key={t.t} transform={`translate(20 ${14 + i * 36})`}>
          <rect x="0" y="0" width="34" height="30" rx="9" fill={t.c} opacity=".16" />
          <rect x="0" y="0" width="34" height="30" rx="9" fill="none" stroke={t.c} strokeOpacity=".55" />
          <text x="17" y="21" fill={t.c} fontSize="16" fontWeight="800" textAnchor="middle">{t.t}</text>
          <text x="44" y="13" fill={t.c} fontSize="10.5" fontWeight="600">{t.n}</text>
          <text x="44" y="26" fill="#8fa3c8" fontSize="8.5">{["compraria hoje", "quero muito", "seria legal", "sem pressa"][i]}</text>
          {[0, 1, 2].map((k) => (
            <g key={k} transform={`translate(${140 + k * 52} 2)`} opacity={i === 3 && k > 1 ? 0 : 1}>
              <rect x="0" y="0" width="46" height="26" rx="8" fill="#101c3c" stroke={t.c} strokeOpacity=".4" />
              <rect x="5" y="5" width="16" height="16" rx="5" fill={t.c} opacity=".35" />
              <rect x="26" y="8" width="15" height="4" rx="2" fill="#dce6ff" opacity=".6" />
              <rect x="26" y="16" width="10" height="3.5" rx="1.75" fill={t.c} opacity=".7" />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}

export function DragTierArt() {
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={10} seed={19} />
      <rect x="20" y="20" width="280" height="52" rx="12" fill="#60a5fa" opacity=".07" />
      <rect x="20" y="20" width="280" height="52" rx="12" fill="none" stroke="#60a5fa" strokeOpacity=".3" strokeDasharray="4 4" />
      <text x="32" y="40" fill="#60a5fa" fontSize="11" fontWeight="700">B · Curtiria</text>
      <rect x="20" y="96" width="280" height="52" rx="12" fill="#ffd66e" opacity=".1" />
      <rect x="20" y="96" width="280" height="52" rx="12" fill="none" stroke="#ffd66e" strokeOpacity=".55" />
      <text x="32" y="116" fill="#ffd66e" fontSize="11" fontWeight="700">S · Obsessão</text>
      <path d="M150 66 Q170 84 190 100" stroke="#ffd66e" strokeOpacity=".5" strokeWidth="2" strokeDasharray="3 4" fill="none" />
      <g transform="translate(178 92) rotate(-7)">
        <rect x="0" y="0" width="76" height="40" rx="10" fill="#16224a" stroke="#ffd66e" strokeOpacity=".7" />
        <rect x="8" y="8" width="24" height="24" rx="7" fill="#ffd66e" opacity=".4" />
        <rect x="38" y="12" width="28" height="5" rx="2.5" fill="#dce6ff" opacity=".75" />
        <rect x="38" y="23" width="18" height="4.5" rx="2.25" fill="#ffd66e" opacity=".8" />
      </g>
      <path d="M246 128l3 16 4-6 6 5-8-15Z" fill="#dce6ff" />
    </svg>
  );
}

export function TasksLayoutArt() {
  const secs = [
    { n: "Geral", c: "#5b7fff" },
    { n: "Casa", c: "#4ade80" },
    { n: "Estudo", c: "#f472b6" },
  ];
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={8} seed={23} />
      <rect x="18" y="16" width="96" height="136" rx="12" fill="#101c3c" stroke="#94b4ff" strokeOpacity=".18" />
      <text x="30" y="34" fill="#8fa3c8" fontSize="8.5" letterSpacing="1.2">SEÇÕES</text>
      {secs.map((s, i) => (
        <g key={s.n} transform={`translate(26 ${44 + i * 30})`}>
          <rect x="0" y="0" width="80" height="24" rx="8" fill={i === 0 ? s.c : "#0a1230"} fillOpacity={i === 0 ? 0.22 : 0.7} stroke={s.c} strokeOpacity={i === 0 ? 0.6 : 0.2} />
          <circle cx="12" cy="12" r="4" fill={s.c} />
          <text x="22" y="15.5" fill="#dce6ff" fontSize="9.5" opacity={i === 0 ? 1 : 0.7}>{s.n}</text>
          <text x="72" y="15.5" fill="#8fa3c8" fontSize="8.5" textAnchor="end">{[4, 2, 3][i]}</text>
        </g>
      ))}
      <rect x="26" y="134" width="80" height="12" rx="6" fill="none" stroke="#94b4ff" strokeOpacity=".25" strokeDasharray="3 3" />
      <text x="66" y="143" fill="#8fa3c8" fontSize="8" textAnchor="middle">＋ Nova seção</text>

      <rect x="126" y="16" width="176" height="52" rx="12" fill="#16224a" stroke="#6ea8ff" strokeOpacity=".55" />
      <text x="140" y="34" fill="#6ea8ff" fontSize="8.5" fontWeight="700" letterSpacing="1.4">AGORA</text>
      <rect x="140" y="42" width="104" height="7" rx="3.5" fill="#dce6ff" opacity=".8" />
      <rect x="140" y="54" width="60" height="5" rx="2.5" fill="#8fa3c8" opacity=".5" />
      <rect x="134" y="76" width="160" height="38" rx="11" fill="#101c3c" stroke="#94b4ff" strokeOpacity=".2" />
      <rect x="146" y="90" width="84" height="6" rx="3" fill="#dce6ff" opacity=".5" />
      <rect x="146" y="102" width="48" height="4.5" rx="2.25" fill="#8fa3c8" opacity=".4" />
      <rect x="142" y="122" width="144" height="30" rx="10" fill="#0d1630" stroke="#94b4ff" strokeOpacity=".14" />
      <rect x="154" y="134" width="70" height="5.5" rx="2.75" fill="#dce6ff" opacity=".3" />
    </svg>
  );
}

export function StepsArt() {
  const dots = [
    { x: 56, done: true }, { x: 124, done: true }, { x: 192, done: false }, { x: 260, done: false },
  ];
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={8} seed={29} />
      <path d="M56 62h204" stroke="#94b4ff" strokeOpacity=".2" strokeWidth="3" strokeLinecap="round" />
      <path d="M56 62h68" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" />
      {dots.map((d, i) => (
        <g key={i}>
          <circle cx={d.x} cy="62" r={d.done ? 13 : 11} fill={d.done ? "#4ade80" : "#101c3c"} stroke={d.done ? "#4ade80" : "#94b4ff"} strokeOpacity={d.done ? 1 : 0.35} strokeWidth="2" />
          {d.done && <path d={`M${d.x - 5} 62l3.5 4 6.5-8`} stroke="#06210f" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          <text x={d.x} y="90" fill={d.done ? "#4ade80" : "#8fa3c8"} fontSize="8.5" textAnchor="middle">etapa {i + 1}</text>
        </g>
      ))}
      <rect x="102" y="108" width="116" height="30" rx="12" fill="#3667c4" />
      <text x="160" y="127" fill="#fff" fontSize="11" fontWeight="600" textAnchor="middle">Concluir etapa</text>
      <text x="160" y="156" fill="#8fa3c8" fontSize="8.5" textAnchor="middle">clique num dot verde para desfazer (em cascata)</text>
    </svg>
  );
}

export function SortArt() {
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={8} seed={31} />
      <rect x="70" y="16" width="180" height="30" rx="15" fill="#0a1230" stroke="#94b4ff" strokeOpacity=".2" />
      <rect x="74" y="20" width="86" height="22" rx="11" fill="#3667c4" />
      <text x="117" y="35" fill="#fff" fontSize="10" fontWeight="600" textAnchor="middle">Personalizado</text>
      <text x="205" y="35" fill="#8fa3c8" fontSize="10" textAnchor="middle">Data</text>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(28 ${64 + i * 32})`}>
          <rect x="0" y="0" width="120" height="24" rx="8" fill="#101c3c" stroke="#94b4ff" strokeOpacity=".18" />
          <circle cx="12" cy="12" r="2" fill="#8fa3c8" /><circle cx="12" cy="6" r="2" fill="#8fa3c8" /><circle cx="12" cy="18" r="2" fill="#8fa3c8" />
          <rect x="24" y="9" width={70 - i * 12} height="6" rx="3" fill="#dce6ff" opacity=".5" />
        </g>
      ))}
      <path d="M156 96h18m0 0-5-5m5 5-5 5" stroke="#6ea8ff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      {[
        { c: "#f87171", l: "hoje" }, { c: "#ffd66e", l: "3 dias" }, { c: "#4ade80", l: "2 sem" },
      ].map((d, i) => (
        <g key={i} transform={`translate(186 ${64 + i * 32})`}>
          <rect x="0" y="0" width="106" height="24" rx="8" fill="#101c3c" stroke={d.c} strokeOpacity=".4" />
          <rect x="10" y="9" width="46" height="6" rx="3" fill="#dce6ff" opacity=".5" />
          <rect x="64" y="6" width="34" height="12" rx="6" fill={d.c} opacity=".2" />
          <text x="81" y="15" fill={d.c} fontSize="7.5" textAnchor="middle">{d.l}</text>
        </g>
      ))}
    </svg>
  );
}

export function GraphArt() {
  const nodes = [
    { x: 84, y: 52, r: 15, c: "#4ade80" },
    { x: 168, y: 34, r: 12, c: "#dce6ff" },
    { x: 232, y: 74, r: 17, c: "#f472b6" },
    { x: 132, y: 108, r: 13, c: "#60a5fa" },
    { x: 56, y: 118, r: 10, c: "#dce6ff" },
    { x: 216, y: 132, r: 11, c: "#4ade80" },
  ];
  const edges = [[0, 1], [1, 2], [0, 3], [3, 4], [3, 2], [2, 5]];
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={16} seed={37} />
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} stroke="#94b4ff" strokeOpacity=".3" strokeWidth="1.4" />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r + 9} fill={n.c} opacity=".13" />
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.c} />
          <circle cx={n.x - n.r * 0.3} cy={n.y - n.r * 0.3} r={n.r * 0.3} fill="#fff" opacity=".35" />
        </g>
      ))}
      <g transform="translate(232 96)">
        <path d="M-14 0h28" stroke="#94b4ff" strokeOpacity=".3" />
      </g>
      <text x="160" y="160" fill="#8fa3c8" fontSize="9" textAnchor="middle">arraste para mover · scroll para zoom</text>
    </svg>
  );
}

export function BadgesArt() {
  const badges = [
    { c: "#4ade80", l: "Wishlist" },
    { c: "#60a5fa", l: "Tarefas" },
    { c: "#f472b6", l: "Criar" },
  ];
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={10} seed={41} />
      {/* halo = blend aditivo das badges, mesma ideia do grafo real */}
      <g transform="translate(84 78)">
        <circle cx="-16" cy="-8" r="34" fill="#4ade80" opacity=".4" style={{ mixBlendMode: "screen" }} />
        <circle cx="16" cy="-4" r="34" fill="#60a5fa" opacity=".4" style={{ mixBlendMode: "screen" }} />
        <circle cx="0" cy="18" r="32" fill="#f472b6" opacity=".45" style={{ mixBlendMode: "screen" }} />
      </g>
      <circle cx="84" cy="78" r="19" fill="#4ade80" />
      <circle cx="78" cy="72" r="6" fill="#fff" opacity=".35" />
      <text x="84" y="128" fill="#8fa3c8" fontSize="8.5" textAnchor="middle">núcleo = badge principal</text>
      <text x="84" y="141" fill="#8fa3c8" fontSize="8.5" textAnchor="middle">halo = todas somadas</text>
      {badges.map((b, i) => (
        <g key={b.l} transform={`translate(176 ${40 + i * 32})`}>
          <rect x="0" y="0" width="118" height="24" rx="12" fill={b.c} opacity=".12" />
          <rect x="0" y="0" width="118" height="24" rx="12" fill="none" stroke={b.c} strokeOpacity=".5" />
          <circle cx="16" cy="12" r="5" fill={b.c} />
          <text x="30" y="16" fill={b.c} fontSize="10.5">{b.l}</text>
        </g>
      ))}
      <text x="235" y="146" fill="#8fa3c8" fontSize="8.5" textAnchor="middle">sem badge = branco</text>
    </svg>
  );
}

export function ConnectArt() {
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={10} seed={43} />
      <circle cx="86" cy="60" r="30" fill="#60a5fa" opacity=".14" />
      <circle cx="86" cy="60" r="17" fill="#60a5fa" />
      <circle cx="80" cy="54" r="5" fill="#fff" opacity=".35" />
      <circle cx="228" cy="110" r="32" fill="#f472b6" opacity=".14" />
      <circle cx="228" cy="110" r="18" fill="#f472b6" />
      <circle cx="222" cy="104" r="5" fill="#fff" opacity=".35" />
      <line x1="103" y1="70" x2="211" y2="100" stroke="#dce6ff" strokeWidth="2" strokeDasharray="5 5" opacity=".7" />
      <circle cx="157" cy="85" r="4" fill="#dce6ff" />
      <path d="M244 126l3 16 4-6 6 5-8-15Z" fill="#dce6ff" />
      <text x="160" y="34" fill="#8fa3c8" fontSize="9.5" textAnchor="middle">segure numa nota e solte na outra</text>
      <text x="160" y="158" fill="#8fa3c8" fontSize="9" textAnchor="middle">conexões são 100% manuais — nada é sugerido</text>
    </svg>
  );
}

export function SolarArt() {
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={26} seed={47} />
      <ellipse cx="160" cy="84" rx="118" ry="56" fill="none" stroke="#94b4ff" strokeOpacity=".14" />
      <ellipse cx="160" cy="84" rx="84" ry="40" fill="none" stroke="#94b4ff" strokeOpacity=".18" />
      <ellipse cx="160" cy="84" rx="48" ry="24" fill="none" stroke="#94b4ff" strokeOpacity=".22" />
      <circle cx="160" cy="84" r="20" fill="#ffd66e" opacity=".22" />
      <circle cx="160" cy="84" r="13" fill="#ffd66e" />
      <circle cx="156" cy="80" r="4" fill="#fff8dc" opacity=".7" />
      <circle cx="208" cy="84" r="9" fill="#4ade80" />
      <circle cx="205" cy="81" r="3" fill="#fff" opacity=".3" />
      <g transform="translate(96 60)">
        <circle cx="0" cy="0" r="11" fill="#c9a0ff" />
        <ellipse cx="0" cy="0" rx="19" ry="5" fill="none" stroke="#e0ccff" strokeWidth="2" strokeOpacity=".8" transform="rotate(-18)" />
      </g>
      <circle cx="256" cy="116" r="12" fill="#6ea8ff" />
      <circle cx="252" cy="112" r="4" fill="#fff" opacity=".3" />
      <circle cx="272" cy="104" r="3.5" fill="#dce6ff" opacity=".8" />
      <circle cx="66" cy="112" r="8" fill="#f0873f" />
      <text x="160" y="158" fill="#8fa3c8" fontSize="9" textAnchor="middle">cada planeta = uma área que você quer desenvolver</text>
    </svg>
  );
}

export function MoonsArt() {
  const moons = [
    { x: 232, y: 34, c: "#8fd0ff", l: "Relatório", sub: "obrigatória" },
    { x: 252, y: 78, c: "#ffcf7d", l: "Recursos", sub: "opcional" },
    { x: 232, y: 122, c: "#d3a6ff", l: "Fotos", sub: "opcional" },
  ];
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={12} seed={53} />
      <circle cx="92" cy="80" r="46" fill="none" stroke="#4ade80" strokeOpacity=".15" strokeWidth="6" />
      <circle cx="92" cy="80" r="46" fill="none" stroke="#4ade80" strokeWidth="6" strokeLinecap="round"
        strokeDasharray="203 289" transform="rotate(-90 92 80)" />
      <circle cx="92" cy="80" r="33" fill="#4ade80" opacity=".16" />
      <circle cx="92" cy="80" r="27" fill="#4ade80" />
      <circle cx="82" cy="70" r="8" fill="#fff" opacity=".22" />
      <text x="92" y="146" fill="#4ade80" fontSize="10" fontWeight="600" textAnchor="middle">saúde 70%</text>
      {moons.map((m) => (
        <g key={m.l}>
          <line x1="120" y1="80" x2={m.x - 10} y2={m.y} stroke="#94b4ff" strokeOpacity=".2" strokeDasharray="3 3" />
          <circle cx={m.x} cy={m.y} r="10" fill={m.c} />
          <circle cx={m.x - 3} cy={m.y - 3} r="3" fill="#fff" opacity=".3" />
          <text x={m.x + 16} y={m.y - 1} fill={m.c} fontSize="10">{m.l}</text>
          <text x={m.x + 16} y={m.y + 11} fill="#8fa3c8" fontSize="8">{m.sub}</text>
        </g>
      ))}
    </svg>
  );
}

export function EventArt() {
  return (
    <svg viewBox={VB} className="guide-art">
      <Stars n={10} seed={59} />
      <rect x="34" y="20" width="200" height="128" rx="16" fill="#101c3c" stroke="#f472b6" strokeOpacity=".45" />
      <circle cx="58" cy="46" r="12" fill="#f472b6" opacity=".2" />
      <path d="M58 40v12M52 46h12" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" />
      <rect x="78" y="38" width="86" height="7" rx="3.5" fill="#dce6ff" opacity=".8" />
      <rect x="78" y="52" width="52" height="5" rx="2.5" fill="#f472b6" opacity=".6" />
      <rect x="176" y="36" width="46" height="16" rx="8" fill="#ffd66e" opacity=".18" />
      <text x="199" y="47" fill="#ffd66e" fontSize="8" textAnchor="middle">30 dias</text>
      {[true, true, false].map((done, i) => (
        <g key={i} transform={`translate(56 ${78 + i * 24})`}>
          <rect x="-4" y="-9" width="18" height="18" rx="6" fill={done ? "#4ade80" : "none"} stroke={done ? "#4ade80" : "#94b4ff"} strokeOpacity={done ? 1 : 0.35} strokeWidth="1.6" />
          {done && <path d="M0 0l3.5 4 6.5-8" stroke="#06210f" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          <rect x="24" y="-4" width={96 - i * 18} height="6" rx="3" fill="#dce6ff" opacity={done ? 0.45 : 0.75} />
          <rect x="132" y="-6" width="42" height="12" rx="6" fill="#8fd0ff" opacity=".18" />
          <text x="153" y="3" fill="#8fd0ff" fontSize="7" textAnchor="middle">{done ? "relatório" : "anexar"}</text>
        </g>
      ))}
      {[[252, 40, "#ffd66e"], [274, 62, "#4ade80"], [258, 92, "#f472b6"], [284, 112, "#60a5fa"], [246, 128, "#ffd66e"]].map(([x, y, c], i) => (
        <rect key={i} x={x as number} y={y as number} width="7" height="10" rx="2" fill={c as string} transform={`rotate(${i * 37} ${x} ${y})`} />
      ))}
      <path d="M262 74l2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5Z" fill="#ffd66e" opacity=".9" />
    </svg>
  );
}

export function OrbitaNetworkArt() {
  const people = [
    { x: 72, y: 52, c: "#69d6ae", label: "amigos" },
    { x: 248, y: 48, c: "#f38ab8", label: "avanços" },
    { x: 264, y: 108, c: "#73b8ff", label: "desafios" },
    { x: 60, y: 112, c: "#ffd278", label: "streak" },
  ];
  return <svg viewBox={VB} className="guide-art">
    <Stars n={28} seed={67} />
    <ellipse cx="160" cy="88" rx="112" ry="60" fill="none" stroke="#9d94ff" strokeOpacity=".18" strokeWidth="1.2" />
    <ellipse cx="160" cy="88" rx="72" ry="40" fill="none" stroke="#9d94ff" strokeOpacity=".26" strokeDasharray="4 4" />
    {people.map((person) => <g key={person.label}>
      <path d={`M160 88 L${person.x} ${person.y}`} stroke={person.c} strokeOpacity=".24" strokeWidth="1.2" />
      <circle cx={person.x} cy={person.y} r="16" fill={person.c} opacity=".12" />
      <circle cx={person.x} cy={person.y} r="8" fill={person.c} />
      <circle cx={person.x - 3} cy={person.y - 3} r="2" fill="#fff" opacity=".55" />
      <text x={person.x} y={person.y + 28} fill={person.c} fontSize="8" textAnchor="middle">{person.label}</text>
    </g>)}
    <circle cx="160" cy="88" r="28" fill="#7c72e8" opacity=".15" />
    <circle cx="160" cy="88" r="18" fill="#7c72e8" />
    <path d="M152 88c4-8 12-8 16 0-4 8-12 8-16 0Z" fill="#fff" opacity=".92" />
    <circle cx="160" cy="84" r="4" fill="#7c72e8" />
    <text x="160" y="156" fill="#aebcf0" fontSize="8" textAnchor="middle">sua evolução circula entre conexões escolhidas</text>
  </svg>;
}

export function OrbitaChoiceArt() {
  return <svg viewBox={VB} className="guide-art">
    <Stars n={20} seed={71} />
    <circle cx="72" cy="84" r="28" fill="#6ea8ff" opacity=".13" />
    <circle cx="72" cy="84" r="16" fill="#6ea8ff" />
    <path d="M64 84h16M72 76v16" stroke="#08142e" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M104 84h52" stroke="#94b4ff" strokeOpacity=".3" strokeWidth="2" strokeDasharray="4 4" />
    <rect x="140" y="48" width="40" height="72" rx="20" fill="#101c3c" stroke="#9d94ff" strokeOpacity=".55" />
    <rect x="152" y="60" width="16" height="48" rx="8" fill="#070e26" stroke="#94b4ff" strokeOpacity=".3" />
    <circle cx="160" cy="96" r="6" fill="#7c72e8" />
    <path d="M180 84h64" stroke="#7c72e8" strokeWidth="2" />
    {[220, 244, 268].map((x, i) => <g key={x}>
      <circle cx={x} cy={64 + i * 20} r="12" fill={["#69d6ae", "#f38ab8", "#ffd278"][i]} opacity=".14" />
      <circle cx={x} cy={64 + i * 20} r="5" fill={["#69d6ae", "#f38ab8", "#ffd278"][i]} />
    </g>)}
    <text x="72" y="128" fill="#8fa3c8" fontSize="8" textAnchor="middle">conquista</text>
    <text x="160" y="136" fill="#b9b2ff" fontSize="8" textAnchor="middle">você confirma</text>
    <text x="252" y="136" fill="#8fa3c8" fontSize="8" textAnchor="middle">sua órbita</text>
  </svg>;
}

export function OrbitaMomentumArt() {
  const days = [false, true, true, true, true, true, true];
  return <svg viewBox={VB} className="guide-art">
    <Stars n={18} seed={73} />
    <path d="M44 108C76 32 148 28 184 80s76 48 96 4" fill="none" stroke="#ff9e68" strokeOpacity=".25" strokeWidth="8" strokeLinecap="round" />
    <path d="M44 108C76 32 148 28 184 80s76 48 96 4" fill="none" stroke="#ff9e68" strokeWidth="2" strokeDasharray="4 8" strokeLinecap="round" />
    {days.map((active, i) => <g key={i} transform={`translate(${48 + i * 32} 116)`}>
      <circle r="9" fill={active ? "#ff9e68" : "#17244a"} stroke={active ? "#ffb38b" : "#60749f"} strokeOpacity=".75" />
      {i === 0 ? <path d="M-4 0h8M0-4v8" stroke="#8fa3c8" strokeWidth="1.6" /> : <path d="M-3 0l2 3 5-6" fill="none" stroke={active ? "#30130a" : "#8fa3c8"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
    </g>)}
    <g transform="translate(104 60)">
      <path d="M0 16C-12 4-4-8 4-16c0 8 8 12 8 24 0 8-5 13-12 16-7-3-12-8-12-16 0-6 4-12 8-16-1 8 1 12 4 16Z" fill="#ff9e68" />
      <path d="M0 12c-5-5-1-10 2-14 1 5 5 8 3 13-1 3-3 5-5 6-2-1-4-3-5-6 0-3 2-6 4-8 0 4 0 7 1 9Z" fill="#ffd278" />
    </g>
    <g transform="translate(232 60)">
      <circle r="28" fill="#7c72e8" opacity=".14" />
      <circle r="17" fill="none" stroke="#b9b2ff" strokeWidth="2" />
      <circle r="9" fill="none" stroke="#b9b2ff" strokeWidth="2" />
      <circle r="3" fill="#f38ab8" />
    </g>
    <text x="104" y="28" fill="#ffb38b" fontSize="8" textAnchor="middle">streak</text>
    <text x="232" y="28" fill="#b9b2ff" fontSize="8" textAnchor="middle">desafio comum</text>
    <text x="160" y="152" fill="#8fa3c8" fontSize="8" textAnchor="middle">ritmo individual · compromisso compartilhado</text>
  </svg>;
}

export function OrbitaSharedArt() {
  return <svg viewBox={VB} className="guide-art">
    <Stars n={24} seed={79} />
    <ellipse cx="160" cy="84" rx="112" ry="52" fill="none" stroke="#94b4ff" strokeOpacity=".15" />
    <circle cx="160" cy="84" r="32" fill="#69d6ae" opacity=".14" />
    <circle cx="160" cy="84" r="24" fill="#69d6ae" />
    <path d="M144 80c8-12 24-12 32 0M148 92c8 8 16 8 24 0" fill="none" stroke="#0b3528" strokeWidth="2" strokeLinecap="round" />
    <circle cx="100" cy="52" r="10" fill="#f38ab8" />
    <circle cx="220" cy="52" r="10" fill="#73b8ff" />
    <circle cx="92" cy="116" r="10" fill="#ffd278" />
    <circle cx="228" cy="116" r="10" fill="#b9b2ff" />
    <path d="M108 56l28 16M212 56l-28 16M100 108l36-16M220 108l-36-16" stroke="#94b4ff" strokeOpacity=".32" strokeWidth="1.2" />
    <g transform="translate(48 40)"><rect width="48" height="20" rx="10" fill="#f38ab8" opacity=".12" /><text x="24" y="13" fill="#f38ab8" fontSize="8" textAnchor="middle">autor A</text></g>
    <g transform="translate(224 40)"><rect width="48" height="20" rx="10" fill="#73b8ff" opacity=".12" /><text x="24" y="13" fill="#73b8ff" fontSize="8" textAnchor="middle">autor B</text></g>
    <text x="160" y="140" fill="#8fa3c8" fontSize="8" textAnchor="middle">um mundo comum · cada contribuição continua sendo sua</text>
  </svg>;
}
