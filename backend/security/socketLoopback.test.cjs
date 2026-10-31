const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { once } = require('node:events');
const { io: client } = require('socket.io-client');

// Real HTTP + Socket.IO transport with the actual server handlers. Configuration,
// identity proof and DB boundary are replaced before server evaluation. No .env,
// JWKS, external listener, PostgreSQL or Supabase client is loaded.
async function fixture() {
  const timers = new Set(), intervals = new Set();
  let acquisitions = 0;
  const database = new Proxy({acquireConnection(){acquisitions++;throw Error('Forbidden DB acquisition');}}, {get(target,key){return target[key] || (async()=>null);}});
  const context = {
    require(name) {
      if(name==='./config/loadEnvironment')return ()=>{};
      if(name==='./middleware/verifyAuth')return {verifyAuth(){},verifyFirebaseIdToken:async token=>{if(!token?.startsWith('fixture-'))throw Error('invalid');return {uid:token,expiresAt:Date.now()+60000};}};
      if(name==='./security/presenceLifecycle') return require('./presenceLifecycle');
      if(name==='./security/socketSecurity')return require('./socketSecurity');
      if(name==='./evolutionGameHandler')return {handleDisconnect(){}};
      if(name.startsWith('./db/') || name.startsWith('./services/'))return database;
      return require(name);
    },
    process:{env:{}},console:{log(){},error(){},warn(){}},structuredClone,
    setTimeout(fn,delay){const timer=setTimeout(fn,delay);timers.add(timer);return timer;},clearTimeout,
    setInterval(fn,delay){const timer=setInterval(fn,delay);intervals.add(timer);return timer;},
  };
  vm.createContext(context);
  const source=fs.readFileSync(require.resolve('../server.js'),'utf8').replace("server.listen(PORT, '0.0.0.0'", "server.listen(0, '127.0.0.1'");
  vm.runInContext(source+'\nglobalThis.fixture = {server,io,gameRooms,playerSockets,pendingColorChoices,followGuessStates,guessResultConfirmations};',context);
  const internals=context.fixture;
  if(!internals.server.listening)await once(internals.server,'listening');
  const sockets=[];
  async function connect(id) {
    const socket=client(`http://127.0.0.1:${internals.server.address().port}`,{auth:{token:`fixture-${id}`},transports:['websocket'],forceNew:true,reconnection:false});
    sockets.push(socket);await once(socket,'connect');return socket;
  }
  return {internals,connect,get acquisitions(){return acquisitions;},async close(){for(const socket of sockets)socket.disconnect();await new Promise(resolve=>internals.io.close(resolve));for(const t of timers)clearTimeout(t);for(const t of intervals)clearInterval(t);}};
}
function receive(socket,event,send,predicate=()=>true) {
  return new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>{socket.off(event,done);reject(Error(`Timeout: ${event}`));},2000);
    function done(data){if(!predicate(data))return;socket.off(event,done);clearTimeout(timeout);resolve(data);}
    socket.on(event,done);send?.();
  });
}

async function confirmTransfer(asker, target, gameId, proposal, color='none') {
  const requestId=proposal.requestId;
  await receive(asker,'waitingForColorChoice',()=>target.emit('colorChoiceSubmit',{gameId,requestId,stage:'start',chosenColor:color}),p=>!!p.transferFlight);
  return receive(asker,'postQuestionPhase',()=>target.emit('colorChoiceSubmit',{gameId,requestId,stage:'complete',chosenColor:color}));
}

for(const count of [3,4])test(`real loopback ${count} players: rooms, question/choice, guess/follow, rounds/win, reconnect; DB acquisitions zero`,{timeout:15000},async()=>{
  const f=await fixture();
  try {
    const sockets=new Map();for(let i=0;i<count;i++)sockets.set(`p${i}`,await f.connect(`p${i}`));
    const host=sockets.get('p0');
    const created=await receive(host,'roomCreated',()=>host.emit('createRoom',{player:{id:'p0',name:'P0'},maxPlayers:count,password:'fixture-private'}));
    const gameId=created.gameId;
    for(let i=1;i<count;i++)await receive(sockets.get(`p${i}`),'joinedRoom',()=>sockets.get(`p${i}`).emit('joinRoom',{gameId,player:{id:`p${i}`,name:`P${i}`},password:'fixture-private'}));
    await receive(host,'gameState',()=>host.emit('startGame',{gameId}),data=>data.gamePhase==='playing');
    const state=f.internals.gameRooms.get(gameId);
    assert.equal(state.gamePhase,'playing');
    // Type 1: two colors, one each. Actor and exact phase checked server-side.
    const firstProposal=await receive(sockets.get('p1'),'cardGiveNotification',()=>host.emit('gameAction',{gameId,action:{type:'question',playerId:'p0',targetPlayerId:'p1',questionType:1,colors:['red','blue']}}));
    await confirmTransfer(host,sockets.get('p1'),gameId,firstProposal);
    await receive(host,'turnEnded',()=>host.emit('endTurn',{gameId,playerId:'p0'}));
    assert.equal(state.players[state.currentPlayerIndex].id,'p1');
    // Type 3: give one genuinely held card and request all of another color.
    const bPlayer=state.players.find(p=>p.id==='p1');
    const giveColor=bPlayer.hand[0].color;
    const getColor=['red','blue','yellow','green'].find(color=>color!==giveColor);
    const exchangeProposal=await receive(sockets.get('p2'),'cardGiveNotification',()=>sockets.get('p1').emit('gameAction',{gameId,action:{type:'question',playerId:'p1',targetPlayerId:'p2',questionType:3,colors:[giveColor,getColor],giveColor,getColor}}));
    await confirmTransfer(sockets.get('p1'),sockets.get('p2'),gameId,exchangeProposal);
    await receive(host,'turnEnded',()=>sockets.get('p1').emit('endTurn',{gameId,playerId:'p1'}));
    assert.equal(state.players[state.currentPlayerIndex].id,'p2');
    // Type 2: only the target selects from their actual available colors.
    const allProposal=await receive(host,'cardGiveNotification',()=>sockets.get('p2').emit('gameAction',{gameId,action:{type:'question',playerId:'p2',targetPlayerId:'p0',questionType:2,colors:['red','blue']}}));
    const choice=f.internals.pendingColorChoices.get(gameId);
    await confirmTransfer(sockets.get('p2'),host,gameId,allProposal,choice.availableColors[0]||'none');
    await receive(host,'turnEnded',()=>sockets.get('p2').emit('endTurn',{gameId,playerId:'p2'}));
    const replacement=await f.connect('p1');
    const reconnected=await receive(replacement,'reconnected',()=>replacement.emit('reconnect',{roomId:gameId,playerId:'p1',playerName:'P1'}));
    assert.equal(reconnected.gameState.hiddenCards.length,2);assert.equal(reconnected.gameState.hiddenCards.some(card=>card.color||card.id),false);
    const old=sockets.get('p1');sockets.set('p1',replacement);
    await receive(old,'error',()=>old.emit('leaveRoom',{gameId,playerId:'p1'}));
    assert.equal(state.players.find(p=>p.id==='p1').socketId,replacement.id);
    // Wrong guess with remaining active players must not reveal the answer in
    // either the result event or the following game-state broadcast.
    const wrong = state.hiddenCards.every(card=>card.color==='red') ? ['blue','blue'] : ['red','red'];
    const wrongActor=state.players[state.currentPlayerIndex].id;
    const wrongSocket=sockets.get(wrongActor);
    await receive(wrongSocket,'followGuessStarted',()=>wrongSocket.emit('gameAction',{gameId,action:{type:'guess',playerId:wrongActor,guessedColors:wrong}}));
    const wrongPromise=receive(host,'guessResult');
    while(f.internals.followGuessStates.has(gameId)) {
      const follow=f.internals.followGuessStates.get(gameId); const id=follow.currentDeciderId;
      await receive(sockets.get(id),'followGuessUpdate',()=>sockets.get(id).emit('followGuessResponse',{gameId,playerId:id,isFollowing:false}));
    }
    const wrongResult=await wrongPromise;
    assert.equal(wrongResult.isCorrect,false); assert.equal(wrongResult.hiddenCards,null); assert.equal(wrongResult.continueGame,true);
    const wrongConfirmation=f.internals.guessResultConfirmations.get(gameId);
    for(const id of [...wrongConfirmation.requiredPlayers])await receive(sockets.get(id),'guessResultDismissed',()=>sockets.get(id).emit('confirmGuessResult',{gameId,playerId:id}));
    // Guessing the known fixture answer exercises the real settlement and win path;
    // clients never obtain that answer before settlement.
    for(let round=0;round<16 && state.gamePhase!=='finished';round++) {
      const actor=state.players[state.currentPlayerIndex].id;
      const answer=state.hiddenCards.map(card=>card.color);
      await receive(sockets.get(actor),'followGuessStarted',()=>sockets.get(actor).emit('gameAction',{gameId,action:{type:'guess',playerId:actor,guessedColors:answer}}));
      const resultPromise=receive(host,'guessResult');
      while(f.internals.followGuessStates.has(gameId)) {
        const follow=f.internals.followGuessStates.get(gameId);
        const id=follow.currentDeciderId;
        await receive(sockets.get(id),'followGuessUpdate',()=>sockets.get(id).emit('followGuessResponse',{gameId,playerId:id,isFollowing:false}));
      }
      const result=await resultPromise;
      assert.equal(result.isCorrect,true);assert.equal(result.hiddenCards.length,2);
      const confirmations=f.internals.guessResultConfirmations.get(gameId);
      if(confirmations) {
        for(const id of [...confirmations.requiredPlayers])await receive(sockets.get(id),'guessResultDismissed',()=>sockets.get(id).emit('confirmGuessResult',{gameId,playerId:id}));
      }
      if(state.gamePhase!=='finished') {
        // The final acknowledgement starts the next round; wait for its broadcast.
        if(state.gamePhase!=='playing')await receive(host,'roundStarted');
        assert.equal(state.gamePhase,'playing');
      }
    }
    assert.equal(state.gamePhase,'finished');assert.ok(state.winner);
    assert.equal(f.acquisitions,0);
  } finally {await f.close();}
});

test('pending type-2 choice: queued attacks are inert; only reconnected target gets private choice and can finish', {timeout:10000}, async()=>{
  const f=await fixture();
  try {
    const a=await f.connect('a'), b=await f.connect('b'), c=await f.connect('c');
    const {gameId}=await receive(a,'roomCreated',()=>a.emit('createRoom',{player:{id:'a',name:'A'},maxPlayers:3}));
    for(const [socket,id] of [[b,'b'],[c,'c']])await receive(socket,'joinedRoom',()=>socket.emit('joinRoom',{gameId,player:{id,name:id}}));
    await receive(a,'gameState',()=>a.emit('startGame',{gameId}),state=>state.gamePhase==='playing');
    await receive(b,'cardGiveNotification',()=>a.emit('gameAction',{gameId,action:{type:'question',playerId:'a',targetPlayerId:'b',questionType:2,colors:['red','blue']}}));
    const state=f.internals.gameRooms.get(gameId), pending=f.internals.pendingColorChoices.get(gameId);
    const before=JSON.stringify(state), pendingBefore=JSON.stringify(pending);
    for(const action of [
      {type:'guess',playerId:'a',guessedColors:['red','blue']},
      {type:'question',playerId:'a',targetPlayerId:'c',questionType:2,colors:['yellow','green']},
    ])await receive(a,'error',()=>a.emit('gameAction',{gameId,action}));
    assert.equal(JSON.stringify(state),before);assert.equal(JSON.stringify(pending),pendingBefore);
    const newB=await f.connect('b');
    const restored=await receive(newB,'cardGiveNotification',()=>newB.emit('reconnect',{roomId:gameId,playerId:'b',playerName:'B'}));
    assert.deepEqual(restored.hand,JSON.parse(JSON.stringify(state.players.find(p=>p.id==='b').hand)));
    assert.equal(restored.isTransferProposal,true);
    const newC=await f.connect('c');let privateChoices=0;
    newC.on('cardGiveNotification',()=>privateChoices++);
    const waiting=await receive(newC,'waitingForColorChoice',()=>newC.emit('reconnect',{roomId:gameId,playerId:'c',playerName:'C'}));
    assert.equal(waiting.availableColors,undefined);assert.equal(waiting.colors,undefined);assert.equal(privateChoices,0);
    const afterReconnect=JSON.stringify(state);
    await receive(b,'error',()=>b.emit('colorChoiceSubmit',{gameId,chosenColor:pending.availableColors[0]||'none'}));
    assert.equal(JSON.stringify(state),afterReconnect);
    await confirmTransfer(a,newB,gameId,restored,pending.availableColors[0]||'none');
    assert.equal(state.gamePhase,'postQuestion');assert.equal(f.internals.pendingColorChoices.has(gameId),false);
    assert.equal(f.acquisitions,0);
  }finally{await f.close();}
});


test('recipient confirmation and flight completion are required; stale, forged and duplicate packets are inert', {timeout:10000}, async()=>{
  const f=await fixture();
  try {
    const a=await f.connect('qa-a'),b=await f.connect('qa-b'),c=await f.connect('qa-c');
    const {gameId}=await receive(a,'roomCreated',()=>a.emit('createRoom',{player:{id:'a',name:'A'},maxPlayers:3}));
    for(const [socket,id] of [[b,'b'],[c,'c']])await receive(socket,'joinedRoom',()=>socket.emit('joinRoom',{gameId,player:{id,name:id}}));
    await receive(a,'gameState',()=>a.emit('startGame',{gameId}),s=>s.gamePhase==='playing');
    const state=f.internals.gameRooms.get(gameId);
    state.players[1].isActive=false; // Wrong guesser is still a legal question recipient.
    const color=state.players[1].hand[0].color;
    const other=['red','yellow','green','blue'].find(c=>c!==color);
    const before=JSON.stringify(state.players.map(p=>p.hand));
    const proposal=await receive(b,'cardGiveNotification',()=>a.emit('gameAction',{gameId,action:{type:'question',playerId:'a',targetPlayerId:'b',questionType:1,colors:[color,other]}}));
    assert.equal(JSON.stringify(state.players.map(p=>p.hand)),before);
    assert.equal(state.gamePhase,'playing');
    assert.equal(proposal.hand.length,4);assert.equal(proposal.hiddenCards,undefined);
    await receive(c,'error',()=>c.emit('colorChoiceSubmit',{gameId,requestId:proposal.requestId,stage:'start',chosenColor:'none'}));
    await receive(b,'error',()=>b.emit('colorChoiceSubmit',{gameId,requestId:'stale',stage:'start',chosenColor:'none'}));
    await receive(b,'error',()=>b.emit('colorChoiceSubmit',{gameId,requestId:proposal.requestId,stage:'complete',chosenColor:'none'}));
    assert.equal(JSON.stringify(state.players.map(p=>p.hand)),before);
    const flight=await receive(c,'waitingForColorChoice',()=>b.emit('colorChoiceSubmit',{gameId,requestId:proposal.requestId,stage:'start',chosenColor:'none'}),p=>!!p.transferFlight);
    assert.equal(flight.transferFlight.cards,undefined);assert.equal(flight.colors,undefined);
    assert.equal(JSON.stringify(state.players.map(p=>p.hand)),before); // Flight started, no early deduction.
    await receive(a,'postQuestionPhase',()=>b.emit('colorChoiceSubmit',{gameId,requestId:proposal.requestId,stage:'complete',chosenColor:'none'}));
    const after=JSON.stringify(state.players.map(p=>p.hand));assert.notEqual(after,before);
    assert.equal(state.players[1].isActive,false);
    assert.equal(state.players.flatMap(p=>p.hand).length,12);
    await receive(b,'error',()=>b.emit('colorChoiceSubmit',{gameId,requestId:proposal.requestId,stage:'complete',chosenColor:'none'}));
    assert.equal(JSON.stringify(state.players.map(p=>p.hand)),after);
    assert.equal(f.acquisitions,0);
  } finally {await f.close();}
});


test('third-player departure cancels an uncommitted transfer and leaves the sole player free to guess', {timeout:10000}, async()=>{
 const f=await fixture();
 try {
  const a=await f.connect('end-a'),b=await f.connect('end-b'),c=await f.connect('end-c');
  const {gameId}=await receive(a,'roomCreated',()=>a.emit('createRoom',{player:{id:'a',name:'A'},maxPlayers:3}));
  for(const [socket,id] of [[b,'b'],[c,'c']])await receive(socket,'joinedRoom',()=>socket.emit('joinRoom',{gameId,player:{id,name:id}}));
  await receive(a,'gameState',()=>a.emit('startGame',{gameId}),s=>s.gamePhase==='playing');
  const state=f.internals.gameRooms.get(gameId);state.players[1].isActive=false;
  const before=JSON.stringify(state.players.map(p=>p.hand));
  const proposal=await receive(b,'cardGiveNotification',()=>a.emit('gameAction',{gameId,action:{type:'question',playerId:'a',targetPlayerId:'b',questionType:1,colors:['red','blue'],requestId:'forged',isTransferProposal:false}}));
  assert.notEqual(proposal.requestId,'forged');assert.equal(proposal.isTransferProposal,true);
  await receive(a,'colorChoiceResult',()=>c.emit('leaveRoom',{gameId,playerId:'c'}),p=>p.cancelled);
  assert.equal(f.internals.pendingColorChoices.has(gameId),false);
  assert.equal(state.gamePhase,'playing');assert.equal(state.players[0].isActive,true);
  assert.equal(JSON.stringify(state.players.map(p=>p.hand)),before);
  await receive(b,'error',()=>b.emit('colorChoiceSubmit',{gameId,requestId:proposal.requestId,stage:'complete',chosenColor:'none'}));
  await receive(a,'guessResult',()=>a.emit('gameAction',{gameId,action:{type:'guess',playerId:'a',guessedColors:['red','blue']}}));
  assert.equal(f.acquisitions,0);
 } finally {await f.close();}
});
