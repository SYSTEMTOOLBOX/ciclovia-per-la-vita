const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../scripts/update-adesioni-count.cjs'),'utf8');
async function run({active=false,connectionTest=false,credential=true,count=3,fail=false}={}) {
  const writes=[];let calls=0;
  const process={env:{CICLOVIA_CONNECTION_TEST:connectionTest?'1':'0',FIREBASE_SERVICE_ACCOUNT_JSON:credential?JSON.stringify({project_id:'ciclovia-per-la-vita'}):undefined}};
  const admin={credential:{cert:()=>({})},initializeApp:()=>({delete:async()=>{}}),firestore:()=>({collection:()=>({count:()=>({get:async()=>{calls++;if(fail)throw Error();return {data:()=>({count})};}})})})};
  vm.runInNewContext(source,{process,console:{log(){},error(){}},require:name=>name==='firebase-admin'?admin:{readFileSync:()=>`export const launchEnabled = ${active};`,writeFileSync:(name,body)=>writes.push(JSON.parse(body))}});
  await new Promise(r=>setImmediate(r));
  return {writes,calls,code:process.exitCode||0};
}
test('job chiuso senza collaudo non accede al database',async()=>assert.deepEqual(await run(),{writes:[],calls:0,code:0}));
test('collaudo richiesto senza credenziale fallisce',async()=>assert.equal((await run({connectionTest:true,credential:false})).code,1));
test('collaudo non pubblica nemmeno se la raccolta fosse aperta',async()=>{
  const result=await run({active:true,connectionTest:true});assert.equal(result.calls,1);assert.equal(result.writes.length,0);
});
test('job pubblica solo aggregati validi e mantiene il file su errore',async()=>{
  const result=await run({active:true,count:0});assert.equal(result.writes[0].count,0);
  assert.deepEqual(Object.keys(result.writes[0]).sort(),['count','description','status','updatedAt']);
  for(const options of [{fail:true},{count:-1},{count:1.5},{credential:false}]){
    const failed=await run({active:true,...options});assert.equal(failed.code,1);assert.equal(failed.writes.length,0);
  }
});
