import React from "react";
import { herbsInGroup, herbForCard, herbImage } from "./herbSpecies";
export const HERB_NAMES = {
  red: "緋羽草",
  yellow: "金鈴草",
  green: "翠卷蕨",
  blue: "星露花",
};
export default function HerbArt({ color, card }) {
  const herb = card ? herbForCard(card) : herbsInGroup(color)[0];
  return (
    <img
      className="herb-specimen"
      src={herb ? herbImage(herb) : undefined}
      alt=""
      aria-hidden="true"
      draggable="false"
    />
  );
}
