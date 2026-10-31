import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiRequest } from '../../services/apiService';
import { useAuth } from '../../firebase/AuthContext';
import { practiceHistory, practiceReplay } from '../../services/practiceReplayStore';
import Tabletop3D from '../games/herbalism/GameRoom/Tabletop3D';
import TabletopHeader from '../games/herbalism/GameRoom/TabletopHeader';
import '../games/herbalism/GameRoom/GameRoom.css';
import '../games/herbalism/GameRoom/TabletopTheme.css';
import { colorCombinations } from '../games/herbalism/GameRoom/tabletopConfig';
import './MatchHistory.css';
const eventNames = { state: '牌桌狀態', CARD_TRANSFER: '問牌與收牌', guessResult: '揭曉與結算', waitingForColorChoice: '等待選色', followGuessStarted: '開始跟猜', followGuessUpdate: '跟猜決定', colorChoiceResult: '選色結果', turnEnded: '回合結束', roundStarted: '新局發牌', playerLeft: '玩家離開' };
const colors = { red: '紅', yellow: '黃', green: '綠', blue: '藍' };
export function eventText(frame) {
  const p = { ...(frame.payload || {}), ...(frame.state.replayAction || {}) };
  const name = id => frame.state.players.find(player => player.id === id)?.name || '玩家';
  const color = c => colors[c] || '未公開顏色';
  if (frame.type === 'questionAsked') {
    const pair = p.colors?.map(color).join('、') || '（當時不可見的顏色）';
    const method = p.questionType === 1 ? `${pair}各一張` : p.questionType === 2 ? `${pair}其中一色全部` :
      p.questionType === 3 ? `給一張${color(p.giveColor)}，要全部${color(p.getColor)}` : '問牌';
    return `${name(p.playerId)} 向 ${name(p.targetPlayerId)} 問牌：${method}`;
  }
  if (frame.type === 'guessMade') return `${name(p.playerId)} 猜牌：${(p.guessedColors || []).map(color).join('、')}`;
  if (frame.type === 'followDecision') return `${name(p.playerId)} 決定${p.isFollowing ? '跟猜' : '不跟猜'}`;
  if (frame.type === 'questionResolved') return `${name(p.targetPlayerId)} → ${name(p.playerId)}：交出 ${p.count} 張牌`;
  if (frame.type === 'CARD_TRANSFER') return `${name(p.from)} → ${name(p.to)}：轉移 ${p.count || 0} 張牌`;
  if (frame.type === 'turnEnded') return `${name(p.playerId)} ${p.prediction ? `預測${color(p.prediction)}，` : ''}結束回合`;
  if (frame.type === 'colorChoiceResult') return `${name(p.playerId || p.targetPlayerId)} 選擇${p.chosenColor === 'none' ? '沒有可交的牌' : color(p.chosenColor)}，交出 ${p.cardsTransferred || 0} 張牌`;
  if (frame.type === 'guessResult') return p.isCorrect ? '猜牌正確，進行結算' : '猜牌錯誤，進行結算';
  if (frame.type === 'followGuessStarted') return `${name(p.guessingPlayerId)} 猜測 ${(p.guessedColors || []).map(c => colors[c] || c).join('、')}，開始跟猜`;
  return eventNames[frame.type] || '牌桌狀態';
}
export default function MatchHistory() {
  const { user } = useAuth();
  const uid = user?.uid || null;
  const { matchId } = useParams();
  const [games, setGames] = useState([]), [frames, setFrames] = useState([]);
  const [index, setIndex] = useState(0), [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1), [error, setError] = useState('');
  const [loading, setLoading] = useState(true), [status, setStatus] = useState('');
  const [storage, setStorage] = useState(null);
  const [loadedOwner, setLoadedOwner] = useState(null);
  const [eventsOpen, setEventsOpen] = useState(false);
  const dialogRef = useRef(null), eventTriggerRef = useRef(null);
  useEffect(() => {
    if (!eventsOpen) { eventTriggerRef.current?.focus(); return undefined; }
    setPlaying(false);
    const panel = dialogRef.current;
    panel?.querySelector('button')?.focus();
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); setEventsOpen(false); }
      if (event.key === 'Tab' && panel) {
        const controls = [...panel.querySelectorAll('button, [href], [tabindex="0"]')].filter(el => !el.disabled);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [eventsOpen]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setFrames([]); setIndex(0); setPlaying(false); setStorage(null); setGames([]);
    setEventsOpen(false);
    (async () => {
      try {
        if (!matchId) {
          const practice = practiceHistory(uid);
          if (active && practice.length) { setGames(practice); setLoadedOwner(uid); setStorage({ mode: 'browser-memory', persistent: false }); }
          let result;
          try { result = await apiRequest('/api/matches'); }
          catch (e) {
            if (!practice.length) throw e;
            result = { data: [], storage: { mode: 'browser-memory', persistent: false } };
            if (active) setError('多人記錄暫時無法載入；下方仍可查看本分頁的 AI 練習記錄');
          }
          if (active) { setGames([...practice, ...result.data].sort((a,b) => Date.parse(b.startedAt)-Date.parse(a.startedAt))); setStorage(result.storage); setLoadedOwner(uid); }
        } else if (matchId.startsWith('ai-')) {
          const data = practiceReplay(uid, matchId);
          if (!data) throw new Error('找不到本分頁的 AI 練習記錄，可能已重新整理或切換帳號');
          if (active) { setFrames(data.frames); setStatus(data.status); setStorage({ mode: 'browser-memory', persistent: false }); setLoadedOwner(uid); }
        } else {
          let after = 0, all = [], result;
          do {
            result = await apiRequest(`/api/matches/${encodeURIComponent(matchId)}/replay?after=${after}`);
            if (!active) return;
            all = all.concat(result.data.frames);
            after = result.data.next;
          } while (after !== null);
          setFrames(all); setStatus(result.data.status); setStorage(result.storage); setLoadedOwner(uid);
        }
      } catch (e) { if (active) setError(e.message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [matchId, uid]);
  useEffect(() => {
    if (!playing || index >= frames.length - 1) return;
    const timer = setTimeout(() => setIndex(i => i + 1), 1200 / speed);
    return () => clearTimeout(timer);
  }, [playing, index, frames.length, speed]);
  const visibleGames = loadedOwner === uid ? games : [];
  const frame = loadedOwner === uid ? frames[index] : null;
  const state = frame?.state;
  // Only the recipient has unredacted cards. Search all snapshots so an empty current hand stays correctly identified.
  const viewerId = useMemo(() => frames.flatMap(f => f.state.players)
    .find(p => p.hand?.some(c => !c.hidden && c.color))?.id, [frames]);
  const replayPlayers = state?.players.map(p => ({...p, score: state.scores?.[p.id] ?? p.score ?? 0}));
  const ownHand = state?.players.find(p => p.id === viewerId)?.hand?.filter(c => !c.hidden) || [];
  const eventFrames = frames.map((f, i) => ({ f, i })).filter(({ f }) => f.type !== 'state');
  const storageNotice = <details className="history-notices"><summary>暫存說明</summary><div>
      {storage?.mode === 'memory' && <p role="note">暫存紀錄 · 伺服器重啟後清空；容量有限，較舊已結束對局可能移除。尚未永久保存。</p>}
      {(storage?.mode === 'browser-memory' || (!matchId && visibleGames.some(g => g.mode === 'ai'))) && <p role="note">AI 練習僅暫存在本分頁，重新整理或關閉分頁後清空，不計入多人戰績。</p>}
    </div></details>;
  return <main className={`match-history ${matchId ? "match-history--replay" : ""}`} aria-label={matchId ? '歷史回放' : '對局記錄'}>
    {!matchId && <header className="history-header">
      <h1>對局記錄</h1><Link to="/lobby/herbalism">返回大廳</Link>
    </header>}
    {!frame && storageNotice}
    {loading && <p role="status">載入中…</p>}
    {error && <p role="alert">{error}</p>}
    {!matchId && <section className="history-list" aria-label="對局列表" tabIndex="0">
      {!loading && !error && !visibleGames.length && <p>還沒有對戰紀錄。舊版未保存的對局無法補回。</p>}
      {visibleGames.map(g => <article className="history-match" key={g.matchId}>
        <h2>{new Date(g.startedAt).toLocaleString()}</h2>
        <p>{g.mode === 'ai' ? 'AI 練習 · 本分頁暫存' : '多人對局'}</p>
        <p>{g.status === 'complete' ? `勝者：${g.winner || '無'} · 共 ${g.rounds} 局` : '未完成對局（已保存部分）'}</p>
        <ul>{g.participants.map((p, i) => <li key={i}>{p.player_name}：{p.final_score} 分{p.is_winner ? ' · 勝利' : ''}</li>)}</ul>
        <Link to={`/history/${g.matchId}`}>回放這場對局</Link>
      </article>)}
    </section>}
    {frame && <section className="history-replay game-room playing-stage three-enabled" aria-label="歷史回放牌桌">
      <TabletopHeader mode={`回放 · 第 ${frame.round} 局`} isYourTurn={state.players[state.currentPlayerIndex]?.id === viewerId}
        guide={eventText(frame)} actions={<>
          {storageNotice}
          <button className="console-hud-button" ref={eventTriggerRef} aria-label="對局事件" onClick={() => setEventsOpen(true)}>紀錄</button>
          <Link className="playing-leave-btn" to="/history">離開</Link>
        </>} />
      <h2 className="replay-event-heading">第 {frame.round} 局 · {['questionAsked','guessMade','followDecision','questionResolved'].includes(frame.type) ? '玩家動作' : eventNames[frame.type] || '牌桌狀態'}</h2>
      <Tabletop3D players={replayPlayers} hand={ownHand} myId={viewerId}
        currentIndex={state.currentPlayerIndex} combos={colorCombinations}
        canAsk={false} canGuess={false} readOnly
        replayAction={{type: frame.type, ...frame.payload, ...state.replayAction}}
        actionContent={<>
      <footer className="replay-controls">
        <span className="replay-view-note">本人視角{status !== 'complete' ? ' · 未完成' : ''}</span>
        <nav className="replay-step-controls" aria-label="重放控制">
          <button disabled={index === 0} onClick={() => {setPlaying(false); setIndex(i => i - 1);}}>上一步</button>
          <button disabled={index >= frames.length - 1} onClick={() => setPlaying(p => !p)}>{playing && index < frames.length - 1 ? '暫停' : '播放'}</button>
          <button disabled={index >= frames.length - 1} onClick={() => {setPlaying(false); setIndex(i => i + 1);}}>下一步</button>
        </nav>
        <details className="replay-options"><summary>回放設定</summary><div>
          <label>速度 <select value={speed} onChange={e => setSpeed(Number(e.target.value))}>{[0.5,1,2,4].map(s => <option key={s} value={s}>{s}×</option>)}</select></label>
          <label>跳轉局數 <select value={frame.round} onChange={e => {setPlaying(false);setIndex(frames.findIndex(f => f.round === Number(e.target.value)));}}>{[...new Set(frames.map(f => f.round))].map(r => <option key={r} value={r}>第 {r} 局</option>)}</select></label>
        </div></details>
        <label className="replay-progress">進度 {index + 1}／{frames.length}<input aria-label="回放進度" type="range" min="0" max={frames.length - 1} value={index} onChange={e => {setPlaying(false);setIndex(Number(e.target.value));}}/></label>
      </footer>
        </>} />
    </section>}
    {frame && eventsOpen && <div className="history-overlay" onClick={e => {if (e.target === e.currentTarget) setEventsOpen(false);}}>
      <section className="history-event-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="history-events-title">
        <header><h2 id="history-events-title">對局事件</h2><button onClick={() => setEventsOpen(false)}>關閉事件</button></header>
        <ol className="history-event-list">{eventFrames.map(({ f, i }) => <li key={f.seq}>
          <button aria-current={i === index ? 'step' : undefined} onClick={() => {setPlaying(false);setIndex(i);setEventsOpen(false);}}>第 {f.round} 局 · {eventText(f)}</button>
        </li>)}</ol>
      </section>

    </div>}
  </main>;
}
