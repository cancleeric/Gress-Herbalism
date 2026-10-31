import React, { useEffect, useState } from 'react';

export default function TreasureChest({ open, canGuess, readOnly, onGuess, onReady }) {
  const [loaded, setLoaded] = useState({});
  useEffect(() => {
    if (loaded.closed && loaded.open) onReady(true);
  }, [loaded, onReady]);
  return <button className={`tabletop3d-treasure-box${open ? ' is-receiving' : ''}`}
    aria-label={readOnly ? '封存寶盒，兩張蓋牌未揭曉' : '開啟猜牌寶盒'}
    disabled={readOnly || !canGuess || open} onClick={onGuess}>
    {['closed', 'open'].map(state => <img key={state}
      src={`${process.env.PUBLIC_URL}/images/tabletop/treasure-chest-${state}.png`}
      className={`treasure-chest-${state}`} alt="" draggable="false"
      onLoad={() => setLoaded(previous => ({ ...previous, [state]: true }))} />)}
  </button>;
}
