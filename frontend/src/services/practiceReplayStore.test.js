import {createPracticeReplayRecorder,practiceHistory,practiceReplay} from './practiceReplayStore';
import LocalGameController from '../controllers/herbalism/LocalGameController';
beforeAll(()=>Object.defineProperty(window,'crypto',{value:require('node:crypto').webcrypto,configurable:true}));
const state=()=>({gamePhase:'playing',round:1,currentPlayerIndex:0,hiddenCards:[{color:'blue'}],
 players:[{id:'a',name:'子安',score:0,hand:[{color:'red'}]},{id:'b',name:'阿哲',isAI:true,score:0,hand:[{color:'green'}]}]});
test('AI records are account-isolated, own-view only and immutable',()=>{
 const r=createPracticeReplayRecorder('isolation','a'),s=state();r.capture(s);r.capture(s);s.players[0].hand=[];
 const [h]=practiceHistory('isolation');expect(h.mode).toBe('ai');expect(practiceHistory('stranger')).toEqual([]);
 expect(practiceReplay('stranger',h.matchId)).toBeNull();const p=practiceReplay('isolation',h.matchId);
 expect(p.frames).toHaveLength(1);expect(p.frames[0].state.players[0].hand).toEqual([{color:'red'}]);
 expect(p.frames[0].state.players[1].hand).toEqual([{hidden:true}]);expect(p.frames[0].state.hiddenCards).toEqual([{hidden:true}]);
 p.frames[0].state.players[0].hand=[];expect(practiceReplay('isolation',h.matchId).frames[0].state.players[0].hand).toHaveLength(1);
 r.close();expect(practiceReplay('isolation',h.matchId).status).toBe('interrupted');
 expect(createPracticeReplayRecorder(null,'a')).toBeNull();
});
test('AI-to-AI transfer cards stay hidden, answer appears only in settlement event',()=>{
 const r=createPracticeReplayRecorder('events','a'),s=state();
 r.capture(s,'CARD_TRANSFER',{from:'b',to:'c',cards:[{color:'green'}]});
 r.capture(s,'followGuessStarted',{guessedColors:['red','red'],hiddenCards:[{color:'blue'}]});
 r.capture(s,'guessResult',{isCorrect:false,hiddenCards:[{color:'blue'}]});
 const frames=practiceReplay('events',practiceHistory('events')[0].matchId).frames;
 expect(frames[0].payload.cards).toBeUndefined();expect(frames[1].payload.hiddenCards).toBeUndefined();
 expect(frames[2].payload.hiddenCards).toEqual([{color:'blue'}]);r.close();
});
test('question intent contains exact type and colors for the human participant before transfer',async()=>{
 const recorder=createPracticeReplayRecorder('action-owner','a');let controller;
 controller=new LocalGameController({players:[{id:'a',name:'子安'},{id:'b',name:'阿哲',isAI:true,setHand:()=>{}},{id:'c',name:'佳蓉',isAI:true,setHand:()=>{}}],
 onStateChange:s=>recorder.capture(s),onEvent:e=>recorder.capture(controller.getState(),e.type,e)});
 controller.startGame();await controller.handleAction({type:'question',playerId:'a',targetPlayerId:'b',questionType:1,colors:['red','yellow']});
 const frames=practiceReplay('action-owner',practiceHistory('action-owner')[0].matchId).frames;
 const intent=frames.findIndex(f=>f.type==='questionAsked'),result=frames.findIndex(f=>f.type==='CARD_TRANSFER');
 expect(intent).toBeGreaterThan(-1);expect(intent).toBeLessThan(result);
 expect(frames[intent].payload).toMatchObject({playerId:'a',targetPlayerId:'b',questionType:1,colors:['red','yellow']});
 expect(frames[intent].state.players[0].hand).toHaveLength(4);recorder.close();
});
test('real local controller records full multi-round completion and stable winner scores',async()=>{
 const recorder=createPracticeReplayRecorder('controller-owner','a');
 const ai=id=>({id,name:id,isAI:true,setHand:()=>{}});
 let controller;
 controller=new LocalGameController({players:[{id:'a',name:'子安'},ai('阿哲'),ai('佳蓉')],
 onStateChange:s=>recorder.capture(s),onEvent:e=>recorder.capture(controller.getState(),e.type,e)});
 controller.startGame();
 for(let rounds=0;rounds<12&&controller.getState().gamePhase!=='finished';rounds++){
  const s=controller.getState(),player=s.players[s.currentPlayerIndex];
  await controller.handleAction({type:'guess',playerId:player.id,guessedColors:s.hiddenCards.map(c=>c.color)});
  for(const p of s.players.filter(p=>p.id!==player.id))await controller.handleFollowGuessResponse({playerId:p.id,isFollowing:false});
  if(controller.getState().gamePhase!=='finished')controller.startNextRound();
 }
 recorder.close();const [h]=practiceHistory('controller-owner'),p=practiceReplay('controller-owner',h.matchId);
 expect(h.status).toBe('complete');expect(h.winner).toBe('子安');expect(h.participants[0].final_score).toBe(9);
 expect(new Set(p.frames.map(f=>f.round)).size).toBe(7);expect(p.frames.at(-1).state.gamePhase).toBe('finished');
 expect(p.frames.some(f=>f.type==='guessResult'&&f.payload.isCorrect)).toBe(true);
});
