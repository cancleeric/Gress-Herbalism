const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function room() { return { gameId: 'room', password: 'private-pass', hiddenCards: [{ color: 'red' }], gamePhase: 'playing', currentPlayerIndex: 0, players: [
  { id: 'a', ownerUid: 'ua', firebaseUid: 'ua', socketId: 'sa', isHost: true, isActive: true, hand: [{color: 'red'}] },
  { id: 'b', ownerUid: 'ub', firebaseUid: 'ub', socketId: 'sb', isActive: true, hand: [{color: 'blue'}] }
] }; }

test('real broadcast function does not expose hidden cards, peer hand, password or identity', () => {
  const source = fs.readFileSync(require.resolve('../server.js'), 'utf8');
  const body = source.slice(source.indexOf('function broadcastGameState('), source.indexOf("io.on('connection'"));
  const state = room(); const sent = [];
  const socket = { id: 'sa', uid: 'ua', emit: (event, payload) => sent.push(payload) };
  const context = { replayRecorder: null, gameRooms: new Map([['room', state]]), playerSockets: new Map([['sa', {gameId:'room', playerId:'a'}]]), io: { to: () => ({emit: (event, payload) => sent.push(payload)}), sockets: { sockets: new Map([['sa', socket]]) } } };
  try { Object.assign(context, require('./socketSecurity')); } catch (_) {}
  vm.runInNewContext(body + "\nbroadcastGameState('room');", context);
  assert.equal(sent.length, 1);
  const payload = JSON.parse(JSON.stringify(sent[0]));
  assert.equal(payload.hiddenCards.length, state.hiddenCards.length);
  assert.equal(payload.hiddenCards.some(card => card.color || card.id), false);
  assert.equal(payload.password, undefined);
  assert.equal(payload.players[0].firebaseUid, undefined);
  assert.equal(payload.players[0].socketId, undefined);
  assert.equal(payload.players[1].hand.some(c => c.color), false);
  assert.equal(state.players[1].hand[0].color, 'blue');
});

const { authorizePacket, installSocketSecurity } = require('./socketSecurity');
test('rejected reconnects emit uniform recoverable failure, never admit or reveal a seat', async () => {
  let middleware;
  const {ctx} = fixture();
  installSocketSecurity({use: fn => middleware = fn}, async () => ({uid:'ua', expiresAt:Date.now()+60000}), ctx);
  const sent = [];
  const socket = {id:'fresh', handshake:{auth:{token:'fixture'}}, once(){}, disconnect(){},
    use(fn){this.guard=fn;}, emit(event,payload){sent.push({event,payload});}};
  await middleware(socket, error => assert.equal(error, undefined));
  for (const data of [{roomId:'gone',playerId:'a'}, {roomId:'room',playerId:'gone'}, {roomId:'room',playerId:'b'}]) {
    let admitted = false;
    socket.guard(['reconnect',data], () => {admitted=true;});
    assert.equal(admitted,false);
    assert.equal(sent.at(-1).event,'reconnectFailed');
    assert.deepEqual(sent.at(-1).payload,sent[0].payload);
    assert.equal(JSON.stringify(sent.at(-1)).includes('ub'),false);
  }
});
function fixture() {
  const state = room();
  const socket = { id:'sa', uid:'ua', authExpiresAt:Date.now()+60000, disconnect() { this.kicked = true; } };
  const ctx = {gameRooms:new Map([['room',state]]), playerSockets:new Map([['sa',{gameId:'room',playerId:'a'}]]), pendingColorChoices:new Map(), postQuestionStates:new Map(), followGuessStates:new Map(), guessResultConfirmations:new Map()};
  return {state,socket,ctx};
}
function allow(event,data,f=fixture()) { authorizePacket(f.socket,[event,data],f.ctx); return f; }

test('all room mutation twins reject outsider and stale sockets', () => {
  for (const event of ['startGame','gameAction','colorChoiceSubmit','endTurn','followGuessResponse','revealHiddenCards','startNextRound','dismissGuessResult','confirmGuessResult','leaveRoom','playerRefreshing']) {
    const f=fixture(); f.socket.id='outside';
    assert.throws(()=>allow(event,{gameId:'room',playerId:'a'},f), /有效玩家/);
    f.socket.id='sa'; f.state.players[0].socketId='new';
    assert.throws(()=>allow(event,{gameId:'room',playerId:'a'},f), /有效玩家/);
  }
});
test('game actions reject impersonation, wrong turn, malformed colors and phase replay', () => {
  const good={gameId:'room',action:{type:'guess',playerId:'a',guessedColors:['red','blue']}};
  allow('gameAction',structuredClone(good));
  for (const modify of [d=>d.action.playerId='b',d=>d.action.guessedColors=['red'],d=>d.action.guessedColors=['red','invalid']]) {
    const data=structuredClone(good); modify(data); assert.throws(()=>allow('gameAction',data));
  }
  const f=fixture(); f.state.gamePhase='followGuessing'; assert.throws(()=>allow('gameAction',good,f));
});
test('question exchange validates actual own hand and target', () => {
  const data={gameId:'room',action:{type:'question',playerId:'a',targetPlayerId:'b',questionType:3,colors:['red','blue'],giveColor:'red',getColor:'blue'}};
  allow('gameAction',structuredClone(data));
  data.action.giveColor='blue'; data.action.getColor='red'; assert.throws(()=>allow('gameAction',data),/交換/);
});
test('start/restart and acknowledgements cannot be driven by arbitrary users', () => {
  const f=fixture(); f.state.gamePhase='waiting'; allow('startGame',{gameId:'room'},f);
  f.state.gamePhase='playing'; assert.throws(()=>allow('startGame',{gameId:'room'},f));
  f.state.gamePhase='roundEnd'; f.ctx.guessResultConfirmations.set('room',{requiredPlayers:['b']});
  assert.throws(()=>allow('confirmGuessResult',{gameId:'room'},f));
  assert.throws(()=>allow('startNextRound',{gameId:'room'},f));
  assert.throws(()=>allow('dismissGuessResult',{gameId:'room'},f));
  assert.throws(()=>allow('revealHiddenCards',{gameId:'room'},f));
});
test('choice/end turn/follow decision require bound expected actor', () => {
  const f=fixture(); f.ctx.pendingColorChoices.set('room',{askingPlayerId:'a',targetPlayerId:'b',availableColors:['red']});
  assert.throws(()=>allow('colorChoiceSubmit',{gameId:'room',chosenColor:'red'},f));
  f.ctx.pendingColorChoices.get('room').targetPlayerId='a'; allow('colorChoiceSubmit',{gameId:'room',chosenColor:'red'},f);
  assert.throws(()=>allow('colorChoiceSubmit',{gameId:'room',chosenColor:'blue'},f));
  f.ctx.postQuestionStates.set('room',{playerId:'a'}); f.state.gamePhase='postQuestion'; allow('endTurn',{gameId:'room',playerId:'a'},f);
  assert.throws(()=>allow('endTurn',{gameId:'room',playerId:'b'},f));
  f.ctx.followGuessStates.set('room',{currentDeciderId:'b'}); f.state.gamePhase='followGuessing';
  assert.throws(()=>allow('followGuessResponse',{gameId:'room',isFollowing:true},f));
});
test('reconnect requires matching owner and prevents cross-room seat', () => {
  const f=fixture(); allow('reconnect',{roomId:'room',playerId:'a'},f);
  assert.throws(()=>allow('reconnect',{roomId:'room',playerId:'b'},f));
  f.ctx.playerSockets.set('sa',{gameId:'other',playerId:'a'});
  assert.throws(()=>allow('reconnect',{roomId:'room',playerId:'a'},f));
});
test('create/join normalize claimed authority and prevent duplicate owner/id', () => {
  const f=fixture(); f.socket.id='new'; f.socket.uid='new-uid';
  const packet=['joinRoom',{gameId:'room',player:{id:'new',name:'Name',firebaseUid:'ua',ownerUid:'ua',isHost:true,score:999}}];
  authorizePacket(f.socket,packet,f.ctx);
  assert.equal(packet[1].player.ownerUid,'new-uid'); assert.equal(packet[1].player.firebaseUid,'new-uid');
  assert.equal(packet[1].player.isHost,undefined); assert.equal(packet[1].player.score,undefined);
  assert.throws(()=>allow('joinRoom',{gameId:'room',player:{id:'a'}},f));
  f.socket.uid='ua'; assert.throws(()=>allow('createRoom',{player:{id:'new'}},f));
});
test('presence derives uid and expiration rejects every packet', () => {
  const f=fixture(); const data={firebaseUid:'ub'}; allow('setPresence',data,f); assert.equal(data.firebaseUid,'ua');
  f.socket.authExpiresAt=Date.now()-1;
  assert.throws(()=>allow('requestRoomList',{},f)); assert.equal(f.socket.kicked,true);
});
test('handshake uses verifier identity, denies missing/expired tokens, and installs packet guard', async () => {
  let middleware;
  const io={use:fn=>middleware=fn}; const {ctx}=fixture();
  installSocketSecurity(io,async token=>{if(token!=='valid') throw Error('bad');return {uid:'anonymous-uid',expiresAt:Date.now()+60000};},ctx);
  const makeSocket=token=>({handshake:{auth:{token}},once(){},use(fn){this.guard=fn;},disconnect(){},emit(){}});
  const socket=makeSocket('valid'); let error;
  await middleware(socket,e=>error=e); assert.equal(error,undefined); assert.equal(socket.uid,'anonymous-uid'); assert.equal(typeof socket.guard,'function');
  await middleware(makeSocket('bad'),e=>error=e); assert.ok(error);
});

function loadServer() {
  const handlers = new Map(); const pendingTimers=[]; const roomEvents=[];
  const io = { sockets:{sockets:new Map()}, middleware:null, use(fn){this.middleware=fn;}, on(event,fn){handlers.set(event,fn);}, emit(){}, to(roomId){return {emit(event,payload){roomEvents.push({roomId,event,payload});}};} };
  function express() { return {use(){},get(){},post(){},put(){},delete(){}}; }
  express.json=()=>()=>{};
  const noopDb = new Proxy({}, {get:()=>async()=>null});
  const context={
    require(name) {
      if(name==='express') return express;
      if(name==='http') return {createServer:()=>({listen(){}})};
      if(name==='socket.io') return {Server:class {constructor(){return io;}}};
      if(name==='cors') return ()=>()=>{};
      if(name==='./config/loadEnvironment') return ()=>{};
      if(name==='./middleware/verifyAuth') return {verifyAuth(){},verifyFirebaseIdToken:async token=>({uid:token,expiresAt:Date.now()+60000})};
      if(name==='./security/presenceLifecycle') return require('./presenceLifecycle');
      if(name==='./security/socketSecurity') return require('./socketSecurity');
      if(name==='./evolutionGameHandler') return {handleDisconnect(){}};
      return noopDb;
    },
    console:{log(){},error(){},warn(){}},process:{env:{}},structuredClone,
    setInterval(){return {unref(){}};},setTimeout(fn){const timer={unref(){},fn};pendingTimers.push(timer);return timer;},clearTimeout(timer){if(timer)timer.cancelled=true;},
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('../server.js'),'utf8')+'\nglobalThis.fixture = {gameRooms,playerSockets,pendingColorChoices,followGuessStates,guessResultConfirmations,disconnectTimeouts,handlePlayerDisconnect};',context);
  return {context,io,pendingTimers,roomEvents,async connect(uid,id) {
    const events=new Map(),sent=[];
    const socket={id,handshake:{auth:{token:uid}},connected:true,sent,
      once(){},use(fn){this.guard=fn;},on(event,fn){events.set(event,fn);},join(){},leave(){},
      emit(event,payload){sent.push({event,payload});},to(){return {emit(){}};},disconnect(){this.connected=false;},
      dispatch(event,data){let accepted=false;const packet=[event,data];this.guard(packet,()=>accepted=true);if(accepted)events.get(event)?.(packet[1]);return accepted;},
    };
    await io.middleware(socket,error=>{if(error)throw error;}); io.sockets.sockets.set(id,socket);handlers.get('connection')(socket);return socket;
  }};
}

test('real server handlers: 3-player start, secret projections, spoof rejection, safe takeover', async () => {
  const server=loadServer(); const a=await server.connect('ua','sa'); const b=await server.connect('ub','sb'); const c=await server.connect('uc','sc');
  assert.equal(a.dispatch('createRoom',{player:{id:'a',name:'A'},maxPlayers:3,password:'secret'}),true);
  const created=a.sent.find(x=>x.event==='roomCreated');const gameId=created.payload.gameId;
  assert.equal(created.payload.gameState.password,undefined);
  b.dispatch('joinRoom',{gameId,player:{id:'b',name:'B'},password:'secret'});
  c.dispatch('joinRoom',{gameId,player:{id:'c',name:'C'},password:'secret'});
  assert.equal(b.dispatch('startGame',{gameId}),false);
  assert.equal(a.dispatch('startGame',{gameId}),true);
  const state=server.context.fixture.gameRooms.get(gameId);
  assert.equal(state.gamePhase,'playing');assert.equal(state.players.length,3);
  for(const socket of [a,b,c]) {
    const output=socket.sent.filter(x=>x.event==='gameState').at(-1).payload;
    assert.equal(output.hiddenCards.length,2);assert.equal(output.hiddenCards.some(card=>card.color||card.id),false);assert.equal(output.password,undefined);
    for(const player of output.players) {
      assert.equal(player.ownerUid,undefined);assert.equal(player.firebaseUid,undefined);assert.equal(player.socketId,undefined);
      if(player.id!==socket.id.slice(1)) assert.equal(player.hand.some(card=>card.color),false);
    }
  }
  const before=JSON.stringify(state);
  assert.equal(b.dispatch('gameAction',{gameId,action:{type:'guess',playerId:'a',guessedColors:['red','blue']}}),false);
  assert.equal(JSON.stringify(state),before);
  assert.equal(a.dispatch('revealHiddenCards',{gameId,playerId:'a'}),false);
  const intruder=await server.connect('ub','intruder');assert.equal(intruder.dispatch('reconnect',{roomId:gameId,playerId:'a'}),false);
  const newA=await server.connect('ua','newA');assert.equal(newA.dispatch('reconnect',{roomId:gameId,playerId:'a'}),true);
  assert.equal(server.context.fixture.playerSockets.has('sa'),false);
  assert.equal(a.dispatch('leaveRoom',{gameId,playerId:'a'}),false);
  const restored=newA.sent.find(x=>x.event==='reconnected').payload.gameState;
  assert.equal(restored.hiddenCards.length,2);assert.equal(restored.hiddenCards.some(card=>card.color||card.id),false);assert.equal(restored.players[0].hand.length,4);
});

for (const phase of ['playing','finished']) test(`explicit ${phase} leave releases owner for new create without changing historical Firebase identity`, async () => {
  const server=loadServer(); const socket=await server.connect('ua','sa');
  socket.dispatch('createRoom',{player:{id:'a',name:'A'},maxPlayers:3});
  const gameId=socket.sent.find(x=>x.event==='roomCreated').payload.gameId;
  const state=server.context.fixture.gameRooms.get(gameId);state.gamePhase=phase;
  assert.equal(socket.dispatch('leaveRoom',{gameId,playerId:'a'}),true);
  assert.equal(state.players[0].ownerUid,undefined);
  assert.equal(state.players[0].firebaseUid,'ua');
  assert.equal(socket.dispatch('createRoom',{player:{id:'next',name:'A'},maxPlayers:3}),true);
});

test('pending choice blocks queued actions and stale phase choices without mutating state', () => {
  const f=fixture();
  f.ctx.pendingColorChoices.set('room',{askingPlayerId:'a',targetPlayerId:'b',colors:['red','blue'],availableColors:['blue']});
  const before=JSON.stringify(f.state);
  for(const action of [
    {type:'guess',playerId:'a',guessedColors:['red','blue']},
    {type:'question',playerId:'a',targetPlayerId:'b',questionType:2,colors:['red','blue']},
  ])assert.throws(()=>allow('gameAction',{gameId:'room',action},f));
  assert.equal(JSON.stringify(f.state),before);
  f.socket.id='sb';f.socket.uid='ub';f.ctx.playerSockets.set('sb',{gameId:'room',playerId:'b'});
  f.state.gamePhase='followGuessing';
  assert.throws(()=>allow('colorChoiceSubmit',{gameId:'room',chosenColor:'blue'},f));
  f.state.gamePhase='playing'; f.state.currentPlayerIndex=1;
  assert.throws(()=>allow('colorChoiceSubmit',{gameId:'room',chosenColor:'blue'},f));
});

async function departureGame() {
  const server=loadServer(),sockets={};
  for(const id of ['a','b','c'])sockets[id]=await server.connect('u'+id,'s'+id);
  sockets.a.dispatch('createRoom',{player:{id:'a',name:'A'},maxPlayers:3});
  const gameId=sockets.a.sent.find(x=>x.event==='roomCreated').payload.gameId;
  for(const id of ['b','c'])sockets[id].dispatch('joinRoom',{gameId,player:{id,name:id}});
  sockets.a.dispatch('startGame',{gameId});
  return {server,sockets,gameId,state:server.context.fixture.gameRooms.get(gameId),internals:server.context.fixture};
}
test('departure of pending color target cancels question and restores asker end-turn path',async()=>{
  const f=await departureGame();
  f.sockets.a.dispatch('gameAction',{gameId:f.gameId,action:{type:'question',playerId:'a',targetPlayerId:'b',questionType:2,colors:['red','blue']}});
  const hands=JSON.stringify(f.state.players.map(p=>p.hand));
  f.sockets.b.dispatch('leaveRoom',{gameId:f.gameId,playerId:'b'});
  assert.equal(f.internals.pendingColorChoices.has(f.gameId),false);
  assert.equal(f.state.gamePhase,'postQuestion');
  const cancellation=f.server.roomEvents.find(event=>event.event==='colorChoiceResult'&&event.payload.cancelled);
  assert.ok(cancellation);assert.equal(cancellation.payload.cardsTransferred,0);
  assert.equal(cancellation.payload.colors,undefined);assert.equal(cancellation.payload.availableColors,undefined);
  assert.equal(JSON.stringify(f.state.players.map(p=>p.hand)),hands);
  assert.equal(f.sockets.a.dispatch('endTurn',{gameId:f.gameId,playerId:'a'}),true);
  assert.equal(f.state.players[f.state.currentPlayerIndex].id,'c');
});

function askType2(f) {
  f.sockets.a.dispatch('gameAction',{gameId:f.gameId,action:{type:'question',playerId:'a',targetPlayerId:'b',questionType:2,colors:['red','blue']}});
}
function completeFixtureGuess(f, correct=true) {
  const actual=f.state.hiddenCards.map(card=>card.color);
  const colors=correct?actual:(actual.every(c=>c==='red')?['blue','blue']:['red','red']);
  f.sockets.a.dispatch('gameAction',{gameId:f.gameId,action:{type:'guess',playerId:'a',guessedColors:colors}});
  f.sockets.b.dispatch('followGuessResponse',{gameId:f.gameId,playerId:'b',isFollowing:false});
  f.sockets.c.dispatch('followGuessResponse',{gameId:f.gameId,playerId:'c',isFollowing:false});
}
test('current turn departure advances turn and transfers host only to seated member',async()=>{
  const f=await departureGame();f.sockets.a.dispatch('leaveRoom',{gameId:f.gameId,playerId:'a'});
  assert.equal(f.state.gamePhase,'playing');assert.equal(f.state.players[f.state.currentPlayerIndex].id,'b');
  assert.equal(f.state.players.find(p=>p.isHost).id,'b');
});
test('pending asker departure cancels unfinished question and advances active turn',async()=>{
  const f=await departureGame();askType2(f);
  f.sockets.a.dispatch('leaveRoom',{gameId:f.gameId,playerId:'a'});
  assert.equal(f.internals.pendingColorChoices.has(f.gameId),false);
  assert.equal(f.state.gamePhase,'playing');assert.equal(f.state.players[f.state.currentPlayerIndex].id,'b');
});
test('departed follow decider passes through existing settlement and is not revived next round',async()=>{
  const f=await departureGame();
  f.sockets.a.dispatch('gameAction',{gameId:f.gameId,action:{type:'guess',playerId:'a',guessedColors:f.state.hiddenCards.map(c=>c.color)}});
  f.sockets.b.dispatch('leaveRoom',{gameId:f.gameId,playerId:'b'});
  const follow=f.internals.followGuessStates.get(f.gameId);
  assert.equal(follow.decisions.b,'pass');assert.equal(follow.currentDeciderId,'c');
  f.sockets.c.dispatch('followGuessResponse',{gameId:f.gameId,playerId:'c',isFollowing:false});
  assert.equal(f.state.gamePhase,'roundEnd');
  const confirmation=f.internals.guessResultConfirmations.get(f.gameId);
  assert.deepEqual(Array.from(confirmation.requiredPlayers),['a','c']);
  for(const id of ['a','c'])f.sockets[id].dispatch('confirmGuessResult',{gameId:f.gameId,playerId:id});
  assert.equal(f.state.gamePhase,'playing');
  const departed=f.state.players.find(p=>p.id==='b');assert.equal(departed.isActive,false);assert.equal(departed.hand.length,0);
  assert.notEqual(f.state.players[f.state.currentPlayerIndex].id,'b');
});
test('unconfirmed departure removes required acknowledgement and unblocks next round',async()=>{
  const f=await departureGame();completeFixtureGuess(f);
  for(const id of ['a','c'])f.sockets[id].dispatch('confirmGuessResult',{gameId:f.gameId,playerId:id});
  assert.equal(f.state.gamePhase,'roundEnd');
  f.sockets.b.dispatch('leaveRoom',{gameId:f.gameId,playerId:'b'});
  assert.equal(f.state.gamePhase,'playing');assert.equal(f.internals.guessResultConfirmations.has(f.gameId),false);
});
test('short disconnect retains pending choice; grace-expiry callback reconciles departed target',async()=>{
  const f=await departureGame();askType2(f);
  f.internals.handlePlayerDisconnect(f.sockets.b,f.gameId,'b');
  assert.equal(f.internals.pendingColorChoices.has(f.gameId),true);assert.equal(f.state.gamePhase,'playing');
  const timer=f.server.pendingTimers.at(-1);assert.equal(typeof timer.fn,'function');timer.fn();
  assert.equal(f.internals.pendingColorChoices.has(f.gameId),false);assert.equal(f.state.gamePhase,'postQuestion');
  assert.equal(f.state.players.find(p=>p.id==='b').ownerUid,undefined);
  assert.equal(f.sockets.a.dispatch('endTurn',{gameId:f.gameId,playerId:'a'}),true);
});
test('last active departure reaches explicit terminal state without advancing indefinitely',async()=>{
  const f=await departureGame();askType2(f);
  for(const id of ['a','b','c'])f.sockets[id].dispatch('leaveRoom',{gameId:f.gameId,playerId:id});
  assert.equal(f.state.gamePhase,'finished');assert.equal(f.internals.pendingColorChoices.has(f.gameId),false);
  assert.equal(f.state.players.some(p=>p.isCurrentTurn),false);
});
for(const correct of [true,false])test(`unconfirmed reconnect resumes sanitized ${correct?'correct':'wrong'} guess result, confirmed member does not replay`,async()=>{
  const f=await departureGame();completeFixtureGuess(f,correct);
  for(const id of ['a','c'])f.sockets[id].dispatch('confirmGuessResult',{gameId:f.gameId,playerId:id});
  const newA=await f.server.connect('ua','newA');newA.dispatch('reconnect',{roomId:f.gameId,playerId:'a'});
  assert.equal(newA.sent.filter(e=>e.event==='guessResult').length,0);
  const newB=await f.server.connect('ub','newB');newB.dispatch('reconnect',{roomId:f.gameId,playerId:'b'});
  const replay=newB.sent.find(e=>e.event==='guessResult');assert.ok(replay);
  assert.equal(replay.payload.isCorrect,correct);
  if(!correct)assert.equal(replay.payload.hiddenCards,null);
  newB.dispatch('confirmGuessResult',{gameId:f.gameId,playerId:'b'});
  assert.equal(f.internals.guessResultConfirmations.has(f.gameId),false);assert.equal(f.state.gamePhase,'playing');
});

test('all-player wrong guess roundEnd survives one departure and deals only remaining owned seats',async()=>{
  const f=await departureGame();
  const actual=f.state.hiddenCards.map(card=>card.color);
  const wrong=actual.every(color=>color==='red')?['blue','blue']:['red','red'];
  f.sockets.a.dispatch('gameAction',{gameId:f.gameId,action:{type:'guess',playerId:'a',guessedColors:wrong}});
  for(const id of ['b','c'])f.sockets[id].dispatch('followGuessResponse',{gameId:f.gameId,playerId:id,isFollowing:true});
  assert.equal(f.state.gamePhase,'roundEnd');assert.equal(f.state.players.filter(p=>p.isActive).length,0);
  f.sockets.b.dispatch('leaveRoom',{gameId:f.gameId,playerId:'b'});
  assert.equal(f.state.gamePhase,'roundEnd');assert.equal(f.internals.guessResultConfirmations.has(f.gameId),true);
  for(const id of ['a','c'])f.sockets[id].dispatch('confirmGuessResult',{gameId:f.gameId,playerId:id});
  assert.equal(f.state.gamePhase,'playing');
  assert.equal(f.state.players.filter(p=>p.ownerUid&&p.isActive).length,2);
  assert.equal(f.state.players.filter(p=>!p.ownerUid).every(p=>!p.isActive&&p.hand.length===0),true);
});

for (const questionType of [1,2,3]) test(`inactive retained seat remains a valid question target, type ${questionType}`, () => {
  const f=fixture(); f.state.players[1].isActive=false;
  const action={type:'question',playerId:'a',targetPlayerId:'b',questionType,colors:['red','blue'],giveColor:'red',getColor:'blue'};
  assert.doesNotThrow(()=>allow('gameAction',{gameId:'room',action},f));
});
test('departed seat, missing target and self remain invalid question targets', () => {
  for (const target of ['departed','missing','self']) {
    const f=fixture();
    if(target==='departed') {f.state.players[1].ownerUid=undefined;f.state.players[1].isActive=false;}
    const action={type:'question',playerId:'a',targetPlayerId:target==='self'?'a':target==='missing'?'gone':'b',questionType:1,colors:['red','blue']};
    assert.throws(()=>allow('gameAction',{gameId:'room',action},f));
  }
});

for(const type of [1,2])test(`empty hands do not consume eligibility after type ${type} question`,async()=>{
 const f=await departureGame();
 f.state.players[0].hand=[];
 f.state.players[1].hand=[];
 f.sockets.a.dispatch('gameAction',{gameId:f.gameId,action:{type:'question',playerId:'a',targetPlayerId:'b',questionType:type,colors:['red','blue']}});
 const proposal=f.sockets.b.sent.filter(e=>e.event==='cardGiveNotification').at(-1).payload;
 f.sockets.b.dispatch('colorChoiceSubmit',{gameId:f.gameId,requestId:proposal.requestId,stage:'start',chosenColor:'none'});
 f.sockets.b.dispatch('colorChoiceSubmit',{gameId:f.gameId,requestId:proposal.requestId,stage:'complete',chosenColor:'none'});
 assert.equal(f.state.players[0].isActive,true);
 assert.equal(f.state.players[1].isActive,true);
 assert.equal(f.state.gamePhase,'postQuestion');
});
