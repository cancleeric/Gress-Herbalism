import LocalGameController from "../../../../controllers/herbalism/LocalGameController";
import { createDeck } from "../../../../utils/herbalism/cardUtils";
import { HERB_CATALOG, herbForCard, herbsInGroup, combinationSpecimens, STARTER_HERB_IDS, HERB_LIBRARY, PAIR_LIBRARY } from "./herbSpecies";

test("all supported deck IDs resolve to 14 unique species, stable across transfer and order changes", () => {
  const local = new LocalGameController({ players: [] }).createDeck();
  const colorIds = createDeck();
  const online = local.map((c) => ({ ...c, id: `card_${c.id}` }));
  for (const deck of [local, colorIds, online]) {
    const species = deck.map(herbForCard);
    expect(new Set(species.map((h) => h.id)).size).toBe(14);
    species.forEach((h, i) => expect(h.color).toBe(deck[i].color));
    const moved = [...deck]
      .reverse()
      .slice(0, 5)
      .map((c) => ({ ...c }));
    moved.forEach((c) =>
      expect(herbForCard(c)).toBe(
        species[deck.findIndex((h) => h.id === c.id)],
      ),
    );
  }
});

test("original four-color deduction counts are unchanged and each artwork/name is unique", () => {
  expect(
    ["red", "yellow", "green", "blue"].map((c) => herbsInGroup(c).length),
  ).toEqual([2, 3, 4, 5]);
  expect(new Set(HERB_CATALOG.map((h) => h.name)).size).toBe(14);
  expect(herbForCard({ id: "unknown", color: "unknown" })).toBeUndefined();
});

test("six inquiry cards only use starter herbs, even when the preview library is larger", () => {
  const combos = [
    ["red", "yellow"],
    ["red", "green"],
    ["red", "blue"],
    ["green", "yellow"],
    ["yellow", "blue"],
    ["green", "blue"],
  ];
  const art = combos.flatMap((colors) => {
    const herbs = combinationSpecimens(colors);
    expect(herbs.map((h) => h.color)).toEqual(colors);
    return herbs;
  });
  expect(new Set(art.map((h) => h.id)).size).toBe(11);
  expect(art.every(herb => STARTER_HERB_IDS.includes(herb.id))).toBe(true);
  expect(HERB_LIBRARY.filter(herb => herb.unlocked)).toHaveLength(14);
  expect(HERB_LIBRARY.find(herb => herb.id === "red-cup").unlocked).toBe(false);
  expect(PAIR_LIBRARY).toHaveLength(6);
  expect(HERB_CATALOG).toHaveLength(14);
  expect(art.filter((h) => h.color === "red")).toHaveLength(3);
});
