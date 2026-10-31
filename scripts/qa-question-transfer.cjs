// Local-only real-auth transport QA. No production URL override, no DB.
const root=require('node:path').resolve(__dirname,'..');
const fs=require('node:fs'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {io}=require(root+'/frontend/node_modules/socket.io-client');
const env=require(root+'/backend/node_modules/dotenv').parse(fs.readFileSync(root+'/frontend/.env.local'));
const port=18323,origin='http://127.0.0.1:'+port;
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let server,exited=false;
function startServer(){server=spawn(process.execPath,[root+'/backend/server.js'],{cwd:root,env:{...process.env,...env,PORT:String(port),REALTIME_ONLY:'1',MEMORY_REPLAY:'1',PERSISTENT_REPLAY:'0',FIREBASE_PROJECT_ID:env.REACT_APP_FIREBASE_PROJECT_ID,SOCKET_PATH:'/herbalism/socket.io'},stdio:['ignore','ignore','pipe']});
server.once('exit',()=>exited=true);server.stderr.on('data',()=>{});}
function receive(s,event,send,predicate=()=>true){return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{s.off(event,on);reject(Error('timeout '+event))},12000);function on(data){if(!predicate(data))return;clearTimeout(timer);s.off(event,on);resolve(data)}s.on(event,on);send?.()})}
async function api(method,body){const r=await fetch('https://identitytoolkit.googleapis.com/v1/accounts:'+method+'?key='+env.REACT_APP_FIREBASE_API_KEY,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});if(!r.ok)throw Error('Firebase '+method+' HTTP '+r.status);return r.json()}
async function run(count){
 const clients=[],tokens=[],states=[],ids=[];let gameId;
 try{
  for(let i=0;i<count;i++){
   const {idToken}=await api('signUp',{returnSecureToken:true});tokens.push(idToken);ids.push('qa11740-'+count+'-'+i+'-'+Date.now());
   const s=io(origin,{path:'/herbalism/socket.io',auth:{token:idToken},transports:['websocket'],reconnection:false,autoConnect:false});clients.push(s);s.on('gameState',v=>states[i]=v);await receive(s,'connect',()=>s.connect());
  }
  ({gameId}=await receive(clients[0],'roomCreated',()=>clients[0].emit('createRoom',{player:{id:ids[0],name:'QA-TRANSFER-A'},maxPlayers:count})));
  for(let i=1;i<count;i++)await receive(clients[i],'joinedRoom',()=>clients[i].emit('joinRoom',{gameId,player:{id:ids[i],name:'QA-TRANSFER-'+i}}));
  await receive(clients[0],'gameState',()=>clients[0].emit('startGame',{gameId}),s=>s.gamePhase==='playing');await delay(100);
  for(const type of [1,2,3]){
   const actor=states[0].currentPlayerIndex,target=(actor+1)%count,peer=(target+1)%count;
   const hand=states[target].players.find(p=>p.id===ids[target]).hand;
   const actorHand=states[actor].players.find(p=>p.id===ids[actor]).hand;
   const first=type===3?actorHand[0].color:hand[0].color,other=['red','yellow','green','blue'].find(c=>c!==first);
   const before=states.map((s,i)=>JSON.stringify(s.players.find(p=>p.id===ids[i]).hand));
   const action={type:'question',playerId:ids[actor],targetPlayerId:ids[target],colors:[first,other],questionType:type,giveColor:first,getColor:other};
   let proposal=await receive(clients[target],'cardGiveNotification',()=>clients[actor].emit('gameAction',{gameId,action}));
   assert.equal(proposal.isTransferProposal,true);await delay(70);
   assert.equal(states[actor].gamePhase,'playing');
   states.forEach((s,i)=>assert.equal(JSON.stringify(s.players.find(p=>p.id===ids[i]).hand),before[i]));
   // Recipient re-authenticates/takes over its own seat; restored request has a new ID.
   if(type===2){
    const old=clients[target],fresh=io(origin,{path:'/herbalism/socket.io',auth:{token:tokens[target]},transports:['websocket'],reconnection:false,autoConnect:false});
    fresh.on('gameState',v=>states[target]=v);await receive(fresh,'connect',()=>fresh.connect());
    const restored=await receive(fresh,'cardGiveNotification',()=>fresh.emit('reconnect',{roomId:gameId,playerId:ids[target]}));
    assert.notEqual(restored.requestId,proposal.requestId);old.disconnect();clients[target]=fresh;proposal=restored;
   }
   const available=proposal.colors.filter(c=>proposal.hand.some(card=>card.color===c));
   const color=type===2?(available[0]||'none'):'none';
   await receive(clients[peer],'error',()=>clients[peer].emit('colorChoiceSubmit',{gameId,requestId:proposal.requestId,stage:'start',chosenColor:color}));
   const flight=await receive(clients[actor],'waitingForColorChoice',()=>clients[target].emit('colorChoiceSubmit',{gameId,requestId:proposal.requestId,stage:'start',chosenColor:color}),v=>!!v.transferFlight);
   assert.equal(flight.colors,undefined);assert.equal(flight.transferFlight.cards,undefined);
   await delay(150); // Never rely on wall time to commit: only completion commits.
   states.forEach((s,i)=>assert.equal(JSON.stringify(s.players.find(p=>p.id===ids[i]).hand),before[i]));
   await receive(clients[actor],'postQuestionPhase',()=>clients[target].emit('colorChoiceSubmit',{gameId,requestId:proposal.requestId,stage:'complete',chosenColor:color}));await delay(70);
   const after=states.map((s,i)=>JSON.stringify(s.players.find(p=>p.id===ids[i]).hand));
   assert.equal(states[0].players.reduce((n,p)=>n+p.hand.length,0),12);
   states.forEach((s,i)=>{assert(s.hiddenCards.every(c=>c.hidden&&!c.color));assert(s.players.filter(p=>p.id!==ids[i]).every(p=>p.hand.every(c=>c.hidden&&!c.color)))})
   await receive(clients[target],'error',()=>clients[target].emit('colorChoiceSubmit',{gameId,requestId:proposal.requestId,stage:'complete',chosenColor:color}));
   states.forEach((s,i)=>assert.equal(JSON.stringify(s.players.find(p=>p.id===ids[i]).hand),after[i]));
   await receive(clients[actor],'turnEnded',()=>clients[actor].emit('endTurn',{gameId,playerId:ids[actor]}));await delay(70);
   console.log('PASS real Firebase auth '+count+' players type '+type+': unchanged before confirm/during flight, completion once, private projections, next turn'+(type===2?', recipient reconnect':''));
  }
 }finally{
  for(let i=0;i<clients.length;i++){if(clients[i].connected&&gameId)clients[i].emit('leaveRoom',{gameId,playerId:ids[i]});clients[i].disconnect()}
  for(const idToken of tokens)try{await api('delete',{idToken})}catch(_){console.error('Anonymous QA account cleanup failed');process.exitCode=1}
 }
}
(async()=>{
 await new Promise((resolve,reject)=>{const probe=require('node:net').createServer();probe.once('error',()=>reject(Error('QA port already in use; no existing process stopped')));probe.listen(port,'127.0.0.1',()=>probe.close(resolve))});
 startServer();
 for(let i=0;i<80;i++){if(exited)throw Error('Isolated backend exited; no existing process stopped');try{const r=await fetch(origin+'/api/health');if(r.ok)break}catch(_){}if(i===79)throw Error('Local backend not ready');await delay(100)}
 await run(3);await run(4);
})().catch(e=>{console.error('QA FAILED',e.message);process.exitCode=1}).finally(()=>server?.kill('SIGTERM'));
