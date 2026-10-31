const { createReplayStore } = require('../replayStore');
function fixture(head, participant) {
 const calls=[];
 const db=jest.fn(name=>{
  const q={};
  for(const op of ['withSchema','select','where','whereIn','whereNotNull','andWhere','orderBy','limit','insert','onConflict','ignore','update','forUpdate'])
   q[op]=jest.fn((...args)=>{calls.push({name,op,args});return q;});
  q.first=jest.fn(async()=> name==='game_history'? head: name==='game_participants'?participant: {event_id:'event'});
  q.then=(ok,no)=>Promise.resolve([]).then(ok,no);
  return q;
 });
 db.raw=(...args)=>({raw:args});db.transaction=async fn=>fn(db);
 return {db,calls};
}
test('non-participant cannot obtain any snapshots',async()=>{
 const {db,calls}=fixture({id:42},null);const store=createReplayStore(db);
 expect(await store.replay('stranger','match')).toBeNull();
 expect(calls).toContainEqual({name:'game_participants',op:'where',args:[{game_history_id:42,firebase_uid:'stranger'}]});
 expect(db.mock.calls.flat()).not.toContain('game_snapshots');
});
test('participant can read only their own seat and a bounded ordered page',async()=>{
 const {db,calls}=fixture({id:42,replay_status:'recording'},{seat_index:2});
 await createReplayStore(db).replay('owner','match',99);
 expect(calls).toContainEqual({name:'game_snapshots',op:'where',args:[{game_history_id:42,viewer_seat:2}]});
 expect(calls).toContainEqual({name:'game_snapshots',op:'limit',args:[100]});
});
test('sequence gaps reject before event write',async()=>{
 const {db}=fixture({id:42,last_event_seq:0});
 await expect(createReplayStore(db).append({matchId:'m',gameId:'r',seq:2,seats:[],startedAt:'now'})).rejects.toThrow('Replay gap');
 expect(db.mock.calls.flat()).not.toContain('game_events');
});
test('same committed event retry never repeats completion statistics',async()=>{
 const {db}=fixture({id:42,last_event_seq:3,replay_status:'complete'});
 await createReplayStore(db).append({matchId:'m',gameId:'r',seq:3,eventId:'event',seats:[],startedAt:'now',complete:true});
 expect(db.mock.calls.flat()).not.toContain('players');
 expect(db.mock.calls.flat()).not.toContain('game_snapshots');
});

test('all runtime queries use the dedicated herbalism namespace', async () => {
 const {db,calls}=fixture({id:42,replay_status:'recording'},{seat_index:2});
 await createReplayStore(db).replay('owner','match',0);
 const namespaces=calls.filter(c=>c.op==='withSchema').map(c=>c.args[0]);
 expect(namespaces.length).toBeGreaterThan(0);
 expect(namespaces.every(n=>n==='herbalism')).toBe(true);
});
