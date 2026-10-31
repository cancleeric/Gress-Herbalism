// Development-only isolated layout fixture. No engine, socket, persistence or hidden game state.
import React, { useState } from "react";
import Tabletop3D from "../components/games/herbalism/GameRoom/Tabletop3D";
import { HERB_CATALOG } from "../components/games/herbalism/GameRoom/herbSpecies";
import QuestionFlow from "../components/games/herbalism/QuestionFlow/QuestionFlow";
import "../components/games/herbalism/GameRoom/GameRoom.css";
const combos = [
  ["red", "yellow"],
  ["red", "green"],
  ["red", "blue"],
  ["green", "yellow"],
  ["yellow", "blue"],
  ["green", "blue"],
].map((colors, i) => ({
  id: `preview-${i}`,
  colors,
  name: colors
    .map((c) => ({ red: "紅", yellow: "黃", green: "綠", blue: "藍" })[c])
    .join(""),
}));
export default function HerbalismTabletopPreview() {
  const [count, setCount] = useState(12),
    [ready, setReady] = useState(false),
    [question, setQuestion] = useState(null);
  const hand = HERB_CATALOG.slice(0, count).map((h) => ({
    id: h.cardId,
    color: h.color,
  }));
  const players = [
    { id: "zi-an", name: "子安", hand, score: 0 },
    ...["阿哲", "佳蓉", "柏宇"].map((name, i) => ({
      id: `seat-${i}`,
      name,
      hand: [],
      score: 0,
    })),
  ];
  return (
    <div className={`game-room playing-stage ${ready ? "three-enabled" : ""}`}>
      <header className="playing-header">
        <strong style={{ color: "#ebd8aa" }}>手牌版面檢查</strong>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setCount(12)}>12 張</button>
          <button onClick={() => setCount(14)}>14 張壓力</button>
        </div>
      </header>
      <div className="console-turn-strip">
        <span>僅版面測試 · 非對局｜12 張為合法上限</span>
      </div>
      <Tabletop3D
        key={count}
        players={players}
        hand={hand}
        myId="zi-an"
        currentIndex={0}
        combos={combos}
        canAsk
        canGuess
        onReady={setReady}
        onAsk={setQuestion}
        onGuess={() => {}}
      />
      {question && (
        <QuestionFlow
          selectedCard={question}
          players={players}
          currentPlayerId="zi-an"
          currentPlayerHand={hand}
          onCancel={() => setQuestion(null)}
          onSubmit={() => setQuestion(null)}
        />
      )}
    </div>
  );
}
