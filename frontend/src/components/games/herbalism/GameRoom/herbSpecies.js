// Art identity only; engine card IDs and color rules are unchanged.
export const HERB_CATALOG = [
  {
    id: "red-1",
    name: "緋羽草",
    color: "red",
    cardId: 1,
  },
  {
    id: "red-2",
    name: "朱珊枝",
    color: "red",
    cardId: 2,
  },
  {
    id: "yellow-1",
    name: "金鈴草",
    color: "yellow",
    cardId: 3,
  },
  {
    id: "yellow-2",
    name: "琥珀輪花",
    color: "yellow",
    cardId: 4,
  },
  {
    id: "yellow-3",
    name: "蜜穗蘭",
    color: "yellow",
    cardId: 5,
  },
  {
    id: "green-1",
    name: "翠卷蕨",
    color: "green",
    cardId: 6,
  },
  {
    id: "green-2",
    name: "碧盾葉",
    color: "green",
    cardId: 7,
  },
  {
    id: "green-3",
    name: "青角苔",
    color: "green",
    cardId: 8,
  },
  {
    id: "green-4",
    name: "玉節草",
    color: "green",
    cardId: 9,
  },
  {
    id: "blue-1",
    name: "星露花",
    color: "blue",
    cardId: 10,
  },
  {
    id: "blue-2",
    name: "靛鐘藤",
    color: "blue",
    cardId: 11,
  },
  {
    id: "blue-3",
    name: "霜羽薊",
    color: "blue",
    cardId: 12,
  },
  {
    id: "blue-4",
    name: "滄扇蘚",
    color: "blue",
    cardId: 13,
  },
  {
    id: "blue-5",
    name: "月瓷蓮",
    color: "blue",
    cardId: 14,
  },
];
export const HERB_GROUPS = {
  red: {
    name: "紅組",
    ink: "#ad2639",
    glow: "#ff526a",
    paper: "#f8e3df",
    symbol: "◆",
  },
  yellow: {
    name: "黃組",
    ink: "#976500",
    glow: "#ffd34c",
    paper: "#fff0bc",
    symbol: "●",
  },
  green: {
    name: "綠組",
    ink: "#216438",
    glow: "#62f0a0",
    paper: "#dcebd0",
    symbol: "▲",
  },
  blue: {
    name: "藍組",
    ink: "#245baf",
    glow: "#60c8ff",
    paper: "#deebfb",
    symbol: "✦",
  },
};
export const herbImage = (herb) =>
  `${process.env.PUBLIC_URL}/images/herbs/${herb.pair ? "pairs/" + herb.pair : "groups/" + herb.id}.webp`;
export const herbsInGroup = (color) =>
  HERB_CATALOG.filter((h) => h.color === color);
export function herbForCard(card) {
  const numericId = /^card_\d+$/.test(String(card.id))
    ? String(card.id).slice(5)
    : String(card.id);
  const exact = HERB_CATALOG.find(
    (h) =>
      h.color === card.color &&
      (String(h.cardId) === numericId || h.id === card.id),
  );
  return exact || herbsInGroup(card.color)[0];
}

// Decorative inquiry cards are not additional physical cards in the deduction deck.
export const EXTRA_INQUIRY_HERB = {
  id: "red-cup",
  name: "丹盞花",
  color: "red",
};
const inquiryArt = {
  "red-yellow": ["red-1", "yellow-1"],
  "green-red": ["red-2", "green-2"],
  "blue-red": ["red-1", "blue-3"],
  "green-yellow": ["green-3", "yellow-2"],
  "blue-yellow": ["yellow-3", "blue-4"],
  "blue-green": ["green-4", "blue-5"],
};
export const ALL_HERB_ART = [...HERB_CATALOG, EXTRA_INQUIRY_HERB];
export function combinationSpecimens(colors) {
  const ids = inquiryArt[[...colors].sort().join("-")] || [];
  return colors.map(
    (color) =>
      ALL_HERB_ART.find((h) => h.color === color && ids.includes(h.id)) ||
      herbsInGroup(color)[0],
  );
}

// Collection capacity is independent of the 14-card deduction deck.
export const STARTER_HERB_IDS = HERB_CATALOG.map((herb) => herb.id);
export const HERB_LIBRARY = ALL_HERB_ART.map((herb) => ({
  ...herb,
  unlocked: STARTER_HERB_IDS.includes(herb.id),
}));
export const PAIR_LIBRARY = Object.entries(inquiryArt).map(([pair, ids]) => ({
  id: `composition-${pair}`,
  pair,
  colors: pair.split("-"),
  name: ids
    .map((id) => ALL_HERB_ART.find((herb) => herb.id === id)?.name)
    .join(" · "),
}));
// Preserve the cup-flower composition in the gallery, not in the starter game's question cards.
PAIR_LIBRARY.find((pair) => pair.pair === "blue-red").name = "丹盞花 · 霜羽薊";
export const inquiryImage = (colors) =>
  `${process.env.PUBLIC_URL}/images/herbs/pairs/${[...colors].sort().join("-") === "blue-red" ? "blue-red-starter" : [...colors].sort().join("-")}.webp`;
