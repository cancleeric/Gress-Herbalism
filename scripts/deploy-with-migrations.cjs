// Explicit release entry: no DB or deployment operations on import.
const { spawnSync } = require('node:child_process');
const GATE = '/Users/yinghaowang/HurricaneSoft/hurricane-authorization-hub/bin/hauth-gate.js';
const DB = '/Users/yinghaowang/HurricaneSoft/hurricane-authorization-hub/bin/primitive-db-batch.js';
const STEPS = 'pre-check,backup,snapshot-csv,migration-apply,import-verify,data-check';
const MIGRATE = 'db.migration.batch', DEPLOY = 'herbalism.production.deploy';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function same(a,b) { return JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort()); }
function release(migrationId, deploymentId, invoke) {
  if (!UUID.test(migrationId || '') || !UUID.test(deploymentId || '') || migrationId === deploymentId) throw Error('Two distinct exact approval request IDs required');
  const call = (file,args,json=true) => {
    const result=invoke(file,args);
    if (!result || result.status !== 0 || result.error || result.signal) throw Error('Formal gate command failed; release stopped');
    if (!json) return result.stdout;
    try { return JSON.parse(result.stdout); } catch (_) { throw Error('Invalid formal receipt; release stopped'); }
  };
  // Validate BOTH entries before any mutation; never replace an absent controller.
  const catalog=call(GATE,['catalog'],false);
  for (const action of [MIGRATE,DEPLOY]) if (!catalog.split('\n').some(l=>l.startsWith(action+'  ['))) throw Error('Required registered action missing: '+action);
  const plan=call(DB,['--print-plan','herbalism',STEPS,'3']);
  if (plan.projectId!=='herbalism' || plan.materialIssue!=='3' || plan.environment!=='prod' || plan.operation!=='apply' ||
      !/^[a-f0-9]{64}$/.test(plan.artifactDigest || '') || plan.steps?.join(',')!==STEPS) throw Error('Unexpected migration plan');
  const histories=[migrationId,deploymentId].map(id=>call(GATE,['history','--request-id',id,'--agent','samantha']));
  histories.forEach((h,i)=>{
    if(h.requestId!==[migrationId,deploymentId][i] || h.agent!=='samantha' || h.phase!=='approved' ||
      !Number.isFinite(Date.parse(h.expiresAt)) || Date.parse(h.expiresAt)<=Date.now()) throw Error('Missing exact active approval');
  });
  const [m,d]=histories;
  const mp={projectId:'herbalism',target:'herbalism-prod',steps:STEPS,artifactDigest:plan.artifactDigest,issue:'3',purpose:m.scope?.params?.purpose};
  if(m.scope?.action!==MIGRATE || typeof mp.purpose!=='string' || !same(m.scope.params,mp)) throw Error('Migration scope mismatch');
  const dp=d.scope?.params;
  const keys=['projectId','environment','migrationRequestId','migrationArtifactDigest','backendImage','frontendImage','issue','purpose'];
  if(d.scope?.action!==DEPLOY || !dp || !same(Object.fromEntries(Object.keys(dp).map(k=>[k,true])),Object.fromEntries(keys.map(k=>[k,true]))) ||
     dp.projectId!=='herbalism' || dp.environment!=='prod' || dp.issue!=='3' || dp.migrationRequestId!==migrationId || dp.migrationArtifactDigest!==plan.artifactDigest ||
     ![dp.backendImage,dp.frontendImage].every(v=>typeof v==='string' && /^asia-east1-docker\.pkg\.dev\/squid-com-hurricanesoft\/[a-z0-9/_-]+@sha256:[a-f0-9]{64}$/.test(v)) ||
     typeof dp.purpose!=='string') throw Error('Deployment scope mismatch');
  const run=(id,action,params)=>{
    const args=['run','--action',action,...Object.entries(params).flatMap(([k,v])=>['--param',k+'='+v]),'--agent','samantha'];
    const result=call(GATE,args);
    if(result.status!=='succeeded'||result.requestId!==id||result.agent!=='samantha'||result.action!==action) throw Error('Execution receipt mismatch; release stopped');
    const history=call(GATE,['history','--request-id',id,'--agent','samantha']);
    if(history.phase!=='succeeded'||history.requestId!==id||history.agent!=='samantha'||history.scope?.action!==action||!same(history.scope.params,params)) throw Error('History verification failed; release stopped');
  };
  run(migrationId,MIGRATE,mp);
  run(deploymentId,DEPLOY,dp);
  return {status:'succeeded',migrationRequestId:migrationId,deploymentRequestId:deploymentId};
}
if(require.main===module){
  try {
    if(process.argv.length!==4) throw Error('Usage: deploy.sh <migration-request-id> <deployment-request-id>');
    const result=release(process.argv[2],process.argv[3],(file,args)=>spawnSync(process.execPath,[file,...args],{encoding:'utf8',timeout:1800000,maxBuffer:1048576,env:process.env}));
    process.stdout.write(JSON.stringify(result)+'\n');
  }catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}
}
module.exports={release,STEPS,MIGRATE,DEPLOY};
