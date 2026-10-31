import React, { useLayoutEffect, useRef } from 'react';
import './TreasureGuessDialog.css';

export default function TreasureGuessDialog({ children, onClose, busy = false }) {
  const panel = useRef(null), chest = useRef(null), current = useRef({ onClose, busy });
  current.current = { onClose, busy };
  useLayoutEffect(() => {
    const previous = document.activeElement;
    const dock = document.querySelector('.tabletop3d-treasure-box');
    const from = dock?.getBoundingClientRect(), to = chest.current.getBoundingClientRect();
    if (from?.width && to.width) {
      chest.current.style.setProperty('--chest-from-x', `${from.left + from.width / 2 - to.left - to.width / 2}px`);
      chest.current.style.setProperty('--chest-from-y', `${from.top + from.height / 2 - to.top - to.height / 2}px`);
      chest.current.style.setProperty('--chest-from-scale', from.width / to.width);
    }
    panel.current.querySelector('button:not(:disabled)')?.focus();
    const keydown = event => {
      if (event.key === 'Escape' && !current.current.busy) {
        event.preventDefault(); current.current.onClose();
      }
      if (event.key !== 'Tab') return;
      const buttons = [...panel.current.querySelectorAll('button:not(:disabled)')];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.removeEventListener('keydown', keydown);
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <div className="treasure-guess-overlay" onClick={() => !busy && onClose()}>
    <section ref={panel} className="treasure-guess-shell" role="dialog" aria-modal="true"
      aria-label="寶盒猜牌" onClick={event => event.stopPropagation()}>
      <header className="treasure-guess-hero">
        <p>封存之謎</p>
        <h2>開啟寶盒</h2>
        <img ref={chest} className="treasure-guess-hero-chest" alt=""
          src={`${process.env.PUBLIC_URL}/images/tabletop/treasure-chest-closed.png`} draggable="false" />
        <button className="treasure-guess-close" type="button" aria-label="關閉寶盒" disabled={busy} onClick={onClose}>×</button>
      </header>
      <div className="treasure-guess-controls">{children}</div>
    </section>
  </div>;
}
