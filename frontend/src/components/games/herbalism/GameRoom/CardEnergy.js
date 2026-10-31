import React, { useEffect, useId, useState } from "react";
import { HERB_GROUPS } from "./herbSpecies";
import "./CardEnergy.css";

// Screen-space effects follow projected 3D card corners, without a continuous WebGL render loop.
export default function CardEnergy({ cards, tap, paused = false }) {
  const prefix = useId().replace(/:/g, "");
  const [hidden, setHidden] = useState(document.hidden);
  useEffect(() => {
    const change = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  return (
    <div
      className="card-energy-layer"
      aria-hidden="true"
      style={{ "--fx-play": paused || hidden ? "paused" : "running" }}
    >
      <svg viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          {cards.map((card) => (
            <linearGradient
              key={card.id}
              id={`${prefix}-${card.id}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor={HERB_GROUPS[card.colors[0]].glow} />
              <stop
                offset="100%"
                stopColor={HERB_GROUPS[card.colors[1] || card.colors[0]].glow}
              />
            </linearGradient>
          ))}
        </defs>
        {cards.map((card, i) => (
          <g
            key={card.id}
            className={`card-energy ${card.selected ? "chosen" : ""} ${card.disabled ? "inactive" : ""}`}
            style={{
              "--glow": HERB_GROUPS[card.colors[0]].glow,
              "--phase": `${i * -0.65}s`,
            }}
          >
            <polygon
              className="card-energy-aura"
              points={card.corners}
              fill="none"
              stroke={`url(#${prefix}-${card.id})`}
              strokeLinejoin="round"
            />
            <polygon
              className="card-energy-trace"
              points={card.corners}
              pathLength="100"
              fill="none"
              stroke={`url(#${prefix}-${card.id})`}
              strokeLinejoin="round"
            />
          </g>
        ))}
      </svg>
      <div className="tabletop-motes">
        {Array.from({ length: 8 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${8 + i * 12}%`,
              top: `${20 + (i % 3) * 22}%`,
              "--glow": Object.values(HERB_GROUPS)[i % 4].glow,
              "--delay": `${i * -1.3}s`,
            }}
          />
        ))}
      </div>
      {tap && (
        <div
          key={tap.id}
          className="card-tap-burst"
          style={{
            left: `${tap.x}%`,
            top: `${tap.y}%`,
            "--glow": HERB_GROUPS[tap.colors[0]].glow,
            "--glow-b": HERB_GROUPS[tap.colors[1] || tap.colors[0]].glow,
          }}
        >
          <i />
          <b />
          <em />
        </div>
      )}
    </div>
  );
}
