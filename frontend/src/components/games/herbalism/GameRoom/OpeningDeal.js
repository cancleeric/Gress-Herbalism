import React, { useLayoutEffect, useRef, useState } from 'react';
import './OpeningDeal.css';

// Screen-space cards can reach the seat badges outside the WebGL canvas.
export default function OpeningDeal({ players, sealedCount = 0, onSealed }) {
  const stage = useRef(null);
  const [paths, setPaths] = useState([]);
  const [finished, setFinished] = useState({});
  useLayoutEffect(() => {
    const table = stage.current.closest('.tabletop3d');
    const update = () => {
      const root = stage.current.getBoundingClientRect();
      const canvas = table.querySelector('.tabletop3d-canvas')?.getBoundingClientRect();
      if (!canvas?.width || !root.width) return;
      const seats = [...table.querySelectorAll('.tabletop-seat')];
      const from = { x: canvas.left + canvas.width / 2 - root.left,
        y: canvas.top + canvas.height * .8 - root.top };
      const seatPaths = players.flatMap((player, index) => {
        const seat = seats.find(item => item.dataset.playerId === String(player.id));
        const rect = seat?.getBoundingClientRect();
        if (!rect?.width) return [];
        return Array.from({ length: player.hand?.length || 0 }, (_, card) => ({
          id: `${player.id}-${card}`, playerId: player.id,
          style: { left: from.x, top: from.y,
            '--deal-dx': `${rect.left + rect.width / 2 - root.left - from.x}px`,
            '--deal-dy': `${rect.top + rect.height / 2 - root.top - from.y}px`,
            animationDelay: `${(sealedCount ? 2850 : 1450) + card * 260 + index * 100}ms` },
        }));
      });
      const box = table.querySelector('.tabletop3d-treasure-box')?.getBoundingClientRect();
      const sealedPaths = box?.width ? Array.from({ length: sealedCount }, (_, card) => ({
        id: `sealed-${card}`, playerId: 'treasure', sealed: true,
        lastSealed: card === sealedCount - 1,
        style: { left: from.x, top: from.y,
          '--deal-dx': `${box.left + box.width * .5 - root.left - from.x}px`,
          '--deal-dy': `${box.top + box.height * .52 - root.top - from.y}px`,
          animationDelay: `${300 + card * 650}ms` },
      })) : [];
      setPaths([...sealedPaths, ...seatPaths]);
    };
    update();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(table);
    table.querySelectorAll('.tabletop-seat, .tabletop3d-canvas, .tabletop3d-treasure-box').forEach(item => observer?.observe(item));
    window.addEventListener('resize', update);
    return () => { observer?.disconnect(); window.removeEventListener('resize', update); };
  }, [players, sealedCount]);
  return <div ref={stage} className="opening-deal-stage" aria-hidden="true">
    {paths.filter(path => !finished[path.id]).map(path => <span key={path.id}
      className={`opening-deal-card${path.sealed ? ' opening-sealed-card' : ''}`} data-recipient-id={path.playerId} style={path.style}
      onAnimationEnd={event => {
        if (event.target === event.currentTarget) {
          setFinished(previous => ({ ...previous, [path.id]: true }));
          if (path.lastSealed) onSealed?.();
        }
      }}><i>本</i></span>)}
  </div>;
}
