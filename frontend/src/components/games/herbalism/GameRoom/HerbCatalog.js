import React, { useEffect, useRef, useState } from "react";
import {
  HERB_LIBRARY,
  PAIR_LIBRARY,
  HERB_GROUPS,
  herbImage,
  herbForCard,
} from "./herbSpecies";
import "./HerbCatalog.css";

export default function HerbCatalog({
  onClose,
  initialHerb = null,
  handCards = null,
  initialGroup = "all",
}) {
  const [group, setGroup] = useState(initialGroup);
  const collection = handCards
    ? handCards.map(herbForCard).filter(Boolean)
    : HERB_LIBRARY;
  const [selected, setSelected] = useState(initialHerb);
  const panel = useRef(null);
  const scroll = useRef(null);
  useEffect(() => {
    scroll.current?.scrollTo?.(0, 0);
  }, [group, selected?.id]);
  const close = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    close.current?.focus();
    const key = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key !== "Tab") return;
      const buttons = [
        ...panel.current.querySelectorAll("button:not(:disabled)"),
      ];
      const first = buttons[0],
        last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div className="herb-catalog-shade">
      <section
        className="herb-catalog"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="herb-catalog-title"
      >
        <header>
          <div>
            <small>BOTANICAL COLLECTION</small>
            <h2 id="herb-catalog-title">
              {selected ? selected.name : handCards ? "我的手牌" : "本草圖庫"}
            </h2>
          </div>
          <button ref={close} onClick={onClose}>
            關閉
          </button>
        </header>
        <nav aria-label="草藥色組">
          <button
            aria-pressed={group === "all"}
            onClick={() => {
              setGroup("all");
              setSelected(null);
            }}
          >
            {handCards ? "全部" : "草藥"} {collection.length}
          </button>
          {!handCards && (
            <button
              aria-pressed={group === "pairs"}
              onClick={() => {
                setGroup("pairs");
                setSelected(null);
              }}
            >
              雙株插畫 {PAIR_LIBRARY.length}
            </button>
          )}
          {Object.entries(HERB_GROUPS).map(([color, g]) => (
            <button
              key={color}
              aria-pressed={group === color}
              style={{ "--group-ink": g.ink }}
              onClick={() => {
                setGroup(color);
                setSelected(null);
              }}
            >
              {g.symbol} {g.name}
            </button>
          ))}
        </nav>
        <div className="herb-catalog-scroll" ref={scroll}>
          {selected ? (
            <div className="herb-catalog-detail">
              <button onClick={() => setSelected(null)}>← 返回草藥集</button>
              <img src={herbImage(selected)} alt={selected.name} />
              <p
                style={{ color: HERB_GROUPS[selected.color]?.ink || "#315e4a" }}
              >
                {HERB_GROUPS[selected.color]?.symbol}{" "}
                {HERB_GROUPS[selected.color]?.name || "雙株插畫"} ·{" "}
                {selected.name}
              </p>
            </div>
          ) : (
            <div className="herb-catalog-grid">
              {(group === "pairs" && !handCards ? PAIR_LIBRARY : collection)
                .filter(
                  (h) =>
                    group === "all" || group === "pairs" || h.color === group,
                )
                .map((h) => (
                  <button
                    key={h.id}
                    className={`herb-catalog-card ${h.pair ? "is-composition" : ""}`}
                    style={{
                      "--group-ink": HERB_GROUPS[h.color]?.ink || "#315e4a",
                      "--group-paper": HERB_GROUPS[h.color]?.paper || "#f2e7c9",
                    }}
                    onClick={() => setSelected(h)}
                    aria-label={`放大${h.name}，${HERB_GROUPS[h.color]?.name || "雙株插畫"}`}
                  >
                    <img src={herbImage(h)} alt="" loading="lazy" />
                    <strong>{h.name}</strong>
                    {h.unlocked === false && (
                      <small className="herb-locked">尚未開放 · 收藏預覽</small>
                    )}
                    <span>
                      {HERB_GROUPS[h.color]?.symbol}{" "}
                      {HERB_GROUPS[h.color]?.name || "雙株插畫"}
                    </span>
                  </button>
                ))}
            </div>
          )}
        </div>
        <footer>
          {handCards
            ? `只顯示你持有的 ${handCards.length} 張手牌`
            : "初始開放 14 種｜每局紅 2 · 黃 3 · 綠 4 · 藍 5"}
        </footer>
      </section>
    </div>
  );
}
