import React from 'react';
import {render,screen,fireEvent} from '@testing-library/react';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import MatchHistory,{eventText} from './MatchHistory';
import {apiRequest} from '../../services/apiService';
import {useAuth} from '../../firebase/AuthContext';
import {createPracticeReplayRecorder,practiceHistory} from '../../services/practiceReplayStore';
// WebGL is verified in the real browser; this double checks the read-only renderer boundary.
jest.mock('../games/herbalism/GameRoom/Tabletop3D', () => function ReplayTable(props) {
  return <section data-testid="shared-table" data-viewer={props.myId}
    data-readonly={props.readOnly} data-can-ask={props.canAsk} data-can-guess={props.canGuess}
    data-cards={props.hand.map(c => c.color).join(',')}>
    {props.players.some(p => p.hand?.some(c => c.hidden)) && <span>蓋牌</span>}
    {props.actionContent}
  </section>;
});
jest.mock('../../services/apiService',()=>({apiRequest:jest.fn()}));
jest.mock('../../firebase/AuthContext',()=>({useAuth:jest.fn()}));
beforeAll(()=>Object.defineProperty(window,'crypto',{value:require('node:crypto').webcrypto,configurable:true}));
const mount=path=>render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/history" element={<MatchHistory/>}/><Route path="/history/:matchId" element={<MatchHistory/>}/></Routes></MemoryRouter>);
beforeEach(()=>{jest.resetAllMocks();useAuth.mockReturnValue({user:{uid:'history-owner'}});});
test('history links to replay',async()=>{apiRequest.mockResolvedValue({data:[{matchId:'abc',startedAt:'2026-10-30',status:'complete',winner:'甲',rounds:2,participants:[]}]});mount('/history');expect(await screen.findByText('回放這場對局')).toHaveAttribute('href','/history/abc');});
test('pages own-view frames and steps between rounds',async()=>{
 const state={players:[{id:'a',name:'甲',hand:[{color:'red'}]},{id:'b',name:'乙',hand:[{hidden:true}]}],currentPlayerIndex:0};
 apiRequest.mockResolvedValueOnce({data:{status:'complete',next:1,frames:[{seq:1,round:1,state,type:'state'}]}}).mockResolvedValueOnce({data:{status:'complete',next:null,frames:[{seq:2,round:2,state,type:'state'}]}});
 mount('/history/abc');await screen.findByText('第 1 局 · 牌桌狀態');expect(screen.getByText('蓋牌')).toBeInTheDocument();fireEvent.click(screen.getByText('下一步'));expect(screen.getByText('第 2 局 · 牌桌狀態')).toBeInTheDocument();fireEvent.change(screen.getByLabelText('跳轉局數'),{target:{value:'1'}});expect(screen.getByText('第 1 局 · 牌桌狀態')).toBeInTheDocument();
});
test('unavailable storage displays error',async()=>{apiRequest.mockRejectedValue(new Error('對戰歷史尚未啟用'));mount('/history');expect(await screen.findByRole('alert')).toHaveTextContent('對戰歷史尚未啟用');});
test('temporary history never claims permanent storage',async()=>{
 apiRequest.mockResolvedValue({data:[],storage:{mode:'memory',persistent:false}});mount('/history');
 fireEvent.click(screen.getByText('暫存說明'));
 expect(await screen.findByRole('note')).toHaveTextContent('伺服器重啟後清空');
 expect(screen.getByRole('note')).toHaveTextContent('尚未永久保存');
});
test('AI history remains available when multiplayer API is offline',async()=>{
 useAuth.mockReturnValue({user:{uid:'offline-owner'}});
 const r=createPracticeReplayRecorder('offline-owner','a');r.capture({gamePhase:'playing',round:1,currentPlayerIndex:0,
 players:[{id:'a',name:'甲',hand:[{color:'red'}]},{id:'b',name:'乙',hand:[{color:'blue'}],isAI:true}]});r.close();
 apiRequest.mockRejectedValue(new Error('offline'));mount('/history');
 expect(await screen.findByText('回放這場對局')).toHaveAttribute('href',`/history/${practiceHistory('offline-owner')[0].matchId}`);
 expect(screen.getByText('AI 練習 · 本分頁暫存')).toBeInTheDocument();
});
test('AI replay uses tab memory, never calls the multiplayer replay endpoint',async()=>{
 useAuth.mockReturnValue({user:{uid:'practice-owner'}});
 const r=createPracticeReplayRecorder('practice-owner','a');r.capture({gamePhase:'playing',round:1,currentPlayerIndex:0,
 players:[{id:'a',name:'甲',hand:[{color:'red'}]},{id:'b',name:'乙',hand:[{color:'blue'}],isAI:true}]});r.close();
 mount(`/history/${practiceHistory('practice-owner')[0].matchId}`);
 expect(await screen.findByText('蓋牌')).toBeInTheDocument();expect(apiRequest).not.toHaveBeenCalled();
});
test('action text describes actor, target, question method/colors, guessing and follow choice',()=>{
 const state={players:[{id:'a',name:'子安'},{id:'b',name:'佳蓉'}]};
 const text=(type,payload,extra={})=>eventText({type,payload,state:{...state,...extra}});
 expect(text('questionAsked',{playerId:'b',targetPlayerId:'a',questionType:1,colors:['red','yellow']})).toBe('佳蓉 向 子安 問牌：紅、黃各一張');
 expect(text('questionAsked',{playerId:'a',targetPlayerId:'b',questionType:2},{replayAction:{colors:['green','blue']}})).toContain('綠、藍其中一色全部');
 expect(text('questionAsked',{playerId:'a',targetPlayerId:'b',questionType:3,giveColor:'red',getColor:'blue'})).toContain('給一張紅，要全部藍');
 expect(text('guessMade',{playerId:'a',guessedColors:['red','red']})).toBe('子安 猜牌：紅、紅');
 expect(text('followDecision',{playerId:'b',isFollowing:false})).toBe('佳蓉 決定不跟猜');
 expect(text('questionAsked',{playerId:'a',targetPlayerId:'b',questionType:1})).toContain('當時不可見');
});
test('event overlay supports Escape/focus return and closes after seeking without hiding playback controls',async()=>{
 const state={players:[{id:'a',name:'甲',hand:[{color:'red'}]},{id:'b',name:'乙',hand:[{hidden:true}]}],currentPlayerIndex:0};
 apiRequest.mockResolvedValue({data:{status:'complete',next:null,frames:[{seq:1,round:1,state,type:'state',payload:{}},{seq:2,round:2,state,type:'turnEnded',payload:{playerId:'a'}}]}});
 mount('/history/dialog-test');await screen.findByText('第 1 局 · 牌桌狀態');
 const trigger=screen.getByRole('button',{name:'對局事件'});fireEvent.click(trigger);
 expect(screen.getByRole('dialog',{name:'對局事件'})).toBeInTheDocument();
 fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(trigger).toHaveFocus();
 fireEvent.click(trigger);fireEvent.click(screen.getByRole('button',{name:'第 2 局 · 甲 結束回合'}));
 expect(screen.queryByRole('dialog')).not.toBeInTheDocument();expect(screen.getByText('第 2 局 · 回合結束')).toBeInTheDocument();
 expect(screen.getByRole('button',{name:'播放'})).toBeInTheDocument();expect(screen.getByLabelText('回放進度')).toHaveValue('1');
});


test('replay feeds the live table only recipient cards and updates them when stepping',async()=>{
 const players = [{id:'me',name:'甲',score:0,hand:[{id:'r',color:'red'},{id:'b',color:'blue'}]},
  {id:'other',name:'乙',hand:[{hidden:true},{hidden:true}]}];
 const before={players,currentPlayerIndex:0,scores:{me:2}};
 const after={...before,players:[{...players[0],hand:[]},players[1]]};
 apiRequest.mockResolvedValue({data:{status:'complete',next:null,frames:[
  {seq:1,round:1,state:before,type:'state',payload:{}},{seq:2,round:1,state:after,type:'state',payload:{}}]}});
 mount('/history/renderer-test');const table=await screen.findByTestId('shared-table');
 expect(table).toHaveAttribute('data-readonly','true');
 expect(table).toHaveAttribute('data-can-ask','false');expect(table).toHaveAttribute('data-can-guess','false');
 expect(table).toHaveAttribute('data-viewer','me');expect(table).toHaveAttribute('data-cards','red,blue');
 fireEvent.click(screen.getByRole('button',{name:'下一步'}));
 expect(table).toHaveAttribute('data-viewer','me');expect(table).toHaveAttribute('data-cards','');
});
