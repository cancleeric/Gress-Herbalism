const { createReplayRecorder } = require('../replayRecorder');
const state = () => ({gameId:'room',currentRound:1,gamePhase:'playing',scores:{a:0}, hiddenCards:[{color:'blue'}],
players:[{id:'a',name:'A',firebaseUid:'uid-a',hand:[{color:'red'}]},{id:'b',name:'B',firebaseUid:'uid-b',hand:[{color:'green'}]}]});
test('immutable per-viewer outcomes, deduplication and ordered writes',async()=>{
 const rows=[];const r=createReplayRecorder({append:async f=>rows.push(f)});const s=state();r.start(s);r.capture(s);r.capture(s);
 s.players[0].hand.push({color:'yellow'});r.capture(s);await r.flush(s);
 expect(rows.map(f=>f.seq)).toEqual([1,2]);
 expect(rows[0].views[0].state.players[0].hand).toEqual([{color:'red'}]);
 expect(rows[0].views[0].state.players[1].hand).toEqual([{hidden:true}]);
 expect(rows[0].views[1].state.players[0].hand).toEqual([{hidden:true}]);
 expect(rows[0].views[0].state.hiddenCards).toEqual([{hidden:true}]);
 expect(JSON.stringify(rows[0].views)).not.toContain('uid-a');
});
test('settlement retained after completion and new match has unique ID',async()=>{
 const rows=[];const r=createReplayRecorder({append:async f=>rows.push(f)});const s=state();r.start(s);r.capture(s);
 s.gamePhase='finished';s.winner='a';r.capture(s);r.capture(s,'guessResult',{hiddenCards:[{color:'blue'}]});await r.flush(s);
 expect(rows[2].payload.hiddenCards).toEqual([{color:'blue'}]);const old=rows[0].matchId;
 r.start(s);r.capture(s);await r.flush(s);expect(rows[3].matchId).not.toBe(old);expect(rows[3].seq).toBe(1);
});
test('failure reports once and stops queued writes',async()=>{
 const append=jest.fn().mockRejectedValue(new Error('offline')),error=jest.fn();const r=createReplayRecorder({append},error);const s=state();
 r.start(s);r.capture(s);s.scores.a=1;r.capture(s);await r.flush(s);expect(append).toHaveBeenCalledTimes(1);expect(error).toHaveBeenCalledWith('room');
});
test('question intent retains details only in entitled own-view snapshots, never shared payload',async()=>{
 const rows=[],r=createReplayRecorder({append:async f=>rows.push(f)}),s=state();
 s.players.push({id:'c',name:'C',firebaseUid:'uid-c',hand:[{color:'blue'}]});r.start(s);
 r.capture(s,'questionAsked',{playerId:'a',targetPlayerId:'b',questionType:3},
  {audience:['a','b'],payload:{colors:['red','yellow'],giveColor:'red',getColor:'yellow'}});
 await r.flush(s);expect(rows[0].payload.colors).toBeUndefined();
 expect(rows[0].views[0].state.replayAction.getColor).toBe('yellow');
 expect(rows[0].views[1].state.replayAction.colors).toEqual(['red','yellow']);
 expect(rows[0].views[2].state.replayAction).toBeUndefined();
 expect(rows[0].views[2].state.players[0].hand).toEqual([{hidden:true}]);
});
