const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const vm=require('node:vm');
const {createRequire}=require('node:module');
const {run}=require('../scripts/windows-backup.cjs');
const {encrypt,encode}=require('../scripts/backup-codec.cjs');
const {verifyBackup}=require('../scripts/restore-adesioni.cjs');
const fixture=()=>{
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'ciclovia-windows-'));
  const directory=path.join(root,'Backup_Ciclovia');fs.mkdirSync(directory);
  const keyFile=path.join(root,'synthetic.json');
  fs.writeFileSync(keyFile,JSON.stringify({project_id:'ciclovia-per-la-vita',type:'service_account',private_key:'SYNTHETIC-NOT-A-KEY',client_email:'synthetic@example.test'}));
  return {root,directory,keyFile,password:'Privata & ! % " Unicode-\u00e8-\u2603-123456789'};
};
test('launcher runner riusa backup e verifica, emette solo numero/esito e pulisce ambiente',async()=>{
  const f=fixture();const previous=process.env.CICLOVIA_BACKUP_PASSPHRASE;
  try {
    let called=false;
    const result=await run({...f},{backup:async options=>{
      called=true;assert.equal(options.quiet,true);
      const file=path.join(f.directory,'test.enc');
      fs.writeFileSync(file,encrypt({format:'ciclovia-adesioni-backup-v2',sourceProject:'ciclovia-per-la-vita',count:1,records:[{uid:'synthetic',fields:encode({nome:'Test'})}]},process.env.CICLOVIA_BACKUP_PASSPHRASE));
      return {file,count:1};
    },verify:verifyBackup});
    assert.equal(called,true);assert.deepEqual(result,{ok:true,count:1});
    assert.equal(process.env.CICLOVIA_BACKUP_PASSPHRASE,previous);
  } finally {fs.rmSync(f.root,{recursive:true,force:true});}
});
test('progetto sbagliato, cartella Git ed emulatori vengono bloccati prima del backup',async()=>{
  const f=fixture();let calls=0;const deps={backup:async()=>{calls++;}};
  try {
    fs.mkdirSync(path.join(f.root,'.git'));
    await assert.rejects(run({...f},deps),/DESTINATION/);
    fs.rmdirSync(path.join(f.root,'.git'));
    fs.writeFileSync(f.keyFile,JSON.stringify({project_id:'wrong'}));
    await assert.rejects(run({...f},deps),/PROJECT/);
    const old=process.env.FIRESTORE_EMULATOR_HOST;
    try {process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';await assert.rejects(run({...f},deps),/EMULATOR/);}
    finally {if(old===undefined)delete process.env.FIRESTORE_EMULATOR_HOST;else process.env.FIRESTORE_EMULATOR_HOST=old;}
    assert.equal(calls,0);
  } finally {fs.rmSync(f.root,{recursive:true,force:true});}
});
test('file non leggibile e conteggio incoerente non producono successo',async()=>{
  const f=fixture();
  try {
    await assert.rejects(run({...f},{backup:async()=>({file:path.join(f.directory,'missing.enc'),count:1}),verify:verifyBackup}));
    await assert.rejects(run({...f},{backup:async()=>({file:'unused',count:1}),verify:()=>({count:2})}),/VERIFY/);
  } finally {fs.rmSync(f.root,{recursive:true,force:true});}
});
test('CLI errori sanificati senza credenziali o password in stdout/stderr',()=>{
  const f=fixture();
  try {
    fs.writeFileSync(f.keyFile,'{"project_id":"wrong"}');
    const result=spawnSync(process.execPath,[path.join(__dirname,'../scripts/windows-backup.cjs')],{input:JSON.stringify(f),encoding:'utf8'});
    assert.equal(result.status,1);assert.equal(result.stdout,'{"ok":false}');assert.equal(result.stderr,'');
  } finally {fs.rmSync(f.root,{recursive:true,force:true});}
});
test('script backup esistente: lettura sintetica, file reale cifrato e verifica esistente',async()=>{
  const f=fixture();
  try {
    const filename=path.join(__dirname,'../scripts/backup-adesioni.cjs');
    const realRequire=createRequire(filename);const module={exports:{}};
    const snapshot={size:2,docs:[{id:'test-a',data:()=>({nome:'Sintetico A'})},{id:'test-b',data:()=>({nome:'Sintetico B'})}]};
    let reads=0;let disposed=false;
    const admin={credential:{cert:()=>({})},initializeApp:()=>({delete:async()=>{disposed=true;}}),firestore:()=>({collection:name=>{
      assert.equal(name,'adesioni');return {get:async()=>{reads++;return snapshot;}};
    }})};
    const fakeRequire=name=>name==='firebase-admin'?admin:realRequire(name);
    vm.runInThisContext('(function(require,module,__dirname){'+fs.readFileSync(filename,'utf8')+'\n})')(fakeRequire,module,path.dirname(filename));
    const result=await run({...f},{backup:module.exports.main,verify:verifyBackup});
    assert.deepEqual(result,{ok:true,count:2});assert.equal(reads,1);assert.equal(disposed,true);
    const files=fs.readdirSync(f.directory);assert.equal(files.length,1);assert.match(files[0],/\.enc$/);
    const bytes=fs.readFileSync(path.join(f.directory,files[0]));assert.ok(!bytes.includes(Buffer.from('Sintetico')));
  } finally {fs.rmSync(f.root,{recursive:true,force:true});}
});
