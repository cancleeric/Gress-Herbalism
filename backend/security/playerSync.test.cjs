const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
function route(getOrCreatePlayer) {
  let handler;
  const source=fs.readFileSync(require.resolve('../server.js'),'utf8');
  const start=source.indexOf("app.post('/api/players/sync'");
  const end=source.indexOf('// 取得玩家統計',start);
  assert.ok(start>=0 && end>start);
  vm.runInNewContext(source.slice(start,end),{app:{post(_path,_auth,fn){handler=fn;}},verifyAuth(){},getOrCreatePlayer});
  return handler;
}
async function invoke(getOrCreatePlayer) {
  const result={status:200};
  const res={status(code){result.status=code;return this;},json(body){result.body=JSON.parse(JSON.stringify(body));return this;}};
  await route(getOrCreatePlayer)({uid:'verified-uid',body:{firebaseUid:'forged',displayName:'name'}},res);
  return result;
}
test('null persistence result never becomes a successful player sync',async()=>{
  const r=await invoke(async()=>null);
  assert.equal(r.status,503);assert.equal(r.body.success,false);assert.equal(r.body.data,undefined);
});
test('verified UID and valid player preserve successful sync contract',async()=>{
  let received;
  const r=await invoke(async(name,uid)=>{received={name,uid};return {id:'player',firebase_uid:uid};});
  assert.equal(received.uid,'verified-uid');assert.equal(r.status,200);assert.equal(r.body.success,true);assert.equal(r.body.data.id,'player');
});
test('player sync exceptions never expose raw provider details',async()=>{
  const r=await invoke(async()=>{throw Error('fixture-private-provider-detail');});
  assert.equal(r.status,500);assert.equal(r.body.success,false);assert.equal(JSON.stringify(r.body).includes('fixture-private-provider-detail'),false);
});
