import React, { useEffect, useRef, useState } from 'react';
import HerbArt from './HerbArt';
import { HERB_GROUPS } from './herbSpecies';
import './LocalQuestionTransfer.css';

const names = { red:'紅', yellow:'黃', green:'綠', blue:'藍' };

export function proposedCards(request, choice) {
  const hand = request.hand || [];
  if (request.questionType === 1) return request.colors.flatMap(color => {
    const card = hand.find(item => item.color === color);
    return card ? [card] : [];
  });
  const color = request.questionType === 3 ? request.getColor : choice;
  return hand.filter(card => card.color === color);
}

function flightPosition(request, card, incoming) {
  const root = document.querySelector('.app--console')?.getBoundingClientRect() || {left:0,top:0,width:window.innerWidth,height:window.innerHeight};
  const seat = [...document.querySelectorAll('.tabletop-seat')].find(item => item.dataset.playerId === request.playerId)?.getBoundingClientRect();
  const hand = [...document.querySelectorAll('[data-hand-color]')].find(item => item.dataset.handColor === card.color)?.getBoundingClientRect();
  const bottom = { x: hand ? hand.left + hand.width / 2 : root.left + root.width / 2, y: hand ? hand.top + hand.height / 2 : root.top + root.height * .85 };
  const top = { x: seat ? seat.left + seat.width / 2 : root.left + root.width / 2, y: seat ? seat.top + seat.height / 2 : root.top + root.height * .2 };
  const from = incoming ? top : bottom, to = incoming ? bottom : top;
  return {'--flight-x':`${from.x}px`, '--flight-y':`${from.y}px`, '--flight-dx':`${to.x-from.x}px`, '--flight-dy':`${to.y-from.y}px`};
}

export default function LocalQuestionTransfer({request, onComplete}) {
  const available = request.colors.filter(color => request.hand.some(card => card.color === color));
  const [choice, setChoice] = useState(available.length === 1 ? available[0] : null);
  const [flights, setFlights] = useState(null);
  const [busy, setBusy] = useState(false);
  const done = useRef(false), panel = useRef(null), confirming = useRef(false);
  const needChoice = request.questionType === 2 && available.length > 1;
  const cards = proposedCards(request, choice);
  const method = request.questionType === 1 ? '兩色各一張' : request.questionType === 2 ? '其中一色全部' : `給你一張${names[request.giveColor]}，要全部${names[request.getColor]}`;
  useEffect(() => { panel.current?.querySelector('button:not(:disabled)')?.focus(); }, []);
  const complete = () => {
    if (done.current) return;
    done.current = true;
    onComplete(choice);
  };
  const confirm = () => {
    if (confirming.current || (needChoice && !choice)) return;
    confirming.current = true;
    setBusy(true);
    const outgoing = cards.map(card => ({...card, incoming:false}));
    const incoming = request.questionType === 3 && request.incomingColor ? [{id:'incoming', color:request.incomingColor, incoming:true}] : [];
    const moves = [...outgoing, ...incoming].map((card, i) => ({...card, style:{...flightPosition(request, card, card.incoming), '--flight-delay':`${i * 100}ms`}}));
    if (!moves.length) { complete(); return; }
    setFlights(moves);
  };
  if (flights) return <div className="local-transfer-stage" role="status" aria-live="polite">
    <p className="local-transfer-announcement">{request.fromPlayer} 向你問牌 · 正在交牌</p>
    {flights.map((card, i) => <span key={`${card.id}-${i}`} className="local-transfer-flying-card" style={card.style}
      onAnimationEnd={event => { if (event.target === event.currentTarget && i === flights.length - 1) complete(); }}>
      <HerbArt color={card.color} /><i style={{color:HERB_GROUPS[card.color].glow}}>{HERB_GROUPS[card.color].symbol}</i>
    </span>)}
  </div>;
  return <div className="local-transfer-backdrop">
    <section className="local-transfer-dialog" role="dialog" aria-modal="true" aria-labelledby="local-transfer-title" ref={panel}
      onKeyDown={event => {
        if(event.key !== 'Tab') return;
        const buttons = [...panel.current.querySelectorAll('button:not(:disabled)')];
        const first = buttons[0], last = buttons[buttons.length-1];
        if(event.shiftKey && document.activeElement === first){event.preventDefault();last?.focus();}
        else if(!event.shiftKey && document.activeElement === last){event.preventDefault();first?.focus();}
      }}>
      <span className="local-transfer-eyebrow">對手正在向你問牌</span>
      <h2 id="local-transfer-title">{request.fromPlayer}</h2>
      <p className="local-transfer-method">{method}</p>
      <div className="local-transfer-color-pair" aria-label={request.colors.map(color=>names[color]).join('、')}>
        {request.colors.map(color=><i key={color} style={{color:HERB_GROUPS[color].glow}}>{HERB_GROUPS[color].symbol}</i>)}
      </div>
      {needChoice && <div className="local-transfer-choices" role="group" aria-label="選擇交出哪一色全部">
        {available.map(color=><button key={color} aria-pressed={choice===color} onClick={()=>setChoice(color)}>
          <i style={{color:HERB_GROUPS[color].glow}}>{HERB_GROUPS[color].symbol}</i>
          <span>交出{names[color]}色全部 · {request.hand.filter(card=>card.color===color).length}張</span>
        </button>)}
      </div>}
      <div className="local-transfer-preview" role="status">
        {needChoice && !choice ? '由你選擇交哪一色，尚未扣牌' : cards.length ? `你將交出 ${cards.length} 張${request.questionType===2||request.questionType===3 ? names[cards[0].color]+'牌' : '牌'}` : '沒有符合的牌可交出'}
      </div>
      <p className="local-transfer-note">確認後才交牌；動畫完成後繼續下一回合</p>
      <button className="local-transfer-confirm" onClick={confirm} disabled={busy || (needChoice && !choice)}>{busy ? '交牌中…' : '確認交牌'}</button>
    </section>
  </div>;
}
