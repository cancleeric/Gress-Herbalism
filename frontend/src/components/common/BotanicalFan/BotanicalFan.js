import React from "react";
export default function BotanicalFan() {
  return (
    <span className="botanical-fan" aria-hidden="true">
      {["red", "yellow", "green", "blue"].map((color, i) => (
        <img
          key={color}
          src={`${process.env.PUBLIC_URL}/images/herbs/groups/${color}-1.webp`}
          alt=""
          draggable="false"
          style={{ "--fan-index": i }}
        />
      ))}
    </span>
  );
}
