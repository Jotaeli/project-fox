export function burstAt(x: number, y: number, colors: string[]) {
  for (let i = 0; i < 16; i++) {
    const s = document.createElement("span");
    const c = colors[i % colors.length];
    s.style.cssText = `position:fixed; left:${x}px; top:${y}px; width:6px; height:6px; border-radius:2px;
      background:${c}; z-index:70; pointer-events:none;`;
    document.body.appendChild(s);
    const ang = Math.random() * Math.PI * 2;
    const d = 40 + Math.random() * 70;
    s.animate(
      [
        { transform: "translate(0,0) rotate(0)", opacity: 1 },
        { transform: `translate(${Math.cos(ang) * d}px, ${Math.sin(ang) * d + 24}px) rotate(${Math.random() * 300 - 150}deg)`, opacity: 0 },
      ],
      { duration: 750 + Math.random() * 350, easing: "cubic-bezier(.2,.7,.4,1)" },
    ).onfinish = () => s.remove();
  }
}
