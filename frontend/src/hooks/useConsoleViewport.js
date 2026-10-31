import { useLayoutEffect, useState } from 'react';

// A fixed game console must fit what the player can actually see, including
// browser zoom and the mobile keyboard, not just the larger layout viewport.
export function readConsoleViewport(win) {
  const visible = win.visualViewport;
  const finitePositive = (value, fallback) => Number.isFinite(value) && value > 0 ? value : fallback;
  return {
    '--console-width': `${Math.min(win.innerWidth, finitePositive(visible?.width, win.innerWidth))}px`,
    '--console-height': `${Math.min(win.innerHeight, finitePositive(visible?.height, win.innerHeight))}px`,
    '--console-left': `${Math.max(0, visible?.offsetLeft || 0)}px`,
    '--console-top': `${Math.max(0, visible?.offsetTop || 0)}px`,
  };
}

export default function useConsoleViewport() {
  const [style, setStyle] = useState(() => readConsoleViewport(window));
  useLayoutEffect(() => {
    const update = () => setStyle(previous => {
      const next = readConsoleViewport(window);
      return Object.keys(next).every(key => previous[key] === next[key]) ? previous : next;
    });
    const visible = window.visualViewport;
    window.addEventListener('resize', update);
    visible?.addEventListener('resize', update);
    visible?.addEventListener('scroll', update);
    update();
    return () => {
      window.removeEventListener('resize', update);
      visible?.removeEventListener('resize', update);
      visible?.removeEventListener('scroll', update);
    };
  }, []);
  return style;
}
