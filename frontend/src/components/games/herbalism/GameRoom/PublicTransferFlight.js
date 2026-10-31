import React, {useLayoutEffect, useState} from 'react';
import './LocalQuestionTransfer.css';

// Public observers see backs and counts only, never private card faces or IDs.
export default function PublicTransferFlight({transfer, onComplete}) {
  const [moves,setMoves] = useState([]);
  React.useEffect(()=>{if(!transfer.count && !transfer.incoming) onComplete();},[transfer, onComplete]);
  useLayoutEffect(() => {
    const seat = id => [...document.querySelectorAll('.tabletop-seat')].find(e=>e.dataset.playerId===id)?.getBoundingClientRect();
    const from=seat(transfer.from),to=seat(transfer.to);
    const center=r=>r ? {x:r.left+r.width/2,y:r.top+r.height/2} : {x:window.innerWidth/2,y:window.innerHeight/2};
    const a=center(from),b=center(to);
    const outgoing=Array.from({length:transfer.count},()=>[a,b]);
    const incoming=Array.from({length:transfer.incoming || 0},()=>[b,a]);
    setMoves([...outgoing,...incoming].map(([start,end],i)=>({'--flight-x':`${start.x}px`,'--flight-y':`${start.y}px`,'--flight-dx':`${end.x-start.x}px`,'--flight-dy':`${end.y-start.y}px`,'--flight-delay':`${i*100}ms`})));
  },[transfer]);
  if (!transfer.count && !transfer.incoming) return null;
  return <div className="local-transfer-stage" role="status" aria-label="玩家正在交牌">
    <p className="local-transfer-announcement">正在交牌 · 請稍候</p>
    {moves.map((style,i)=><span key={i} style={style} className="local-transfer-flying-card public-transfer-back"
      onAnimationEnd={event=>{if(event.target===event.currentTarget && i===moves.length-1)onComplete();}}>✦</span>)}
  </div>;
}
