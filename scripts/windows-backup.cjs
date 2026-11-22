'use strict';
// La password arriva solo attraverso stdin, mai negli argomenti o in un file.
const fs=require('node:fs');
const path=require('node:path');
async function run(input,{backup,verify}={}) {
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) throw Error('EMULATOR');
  const {keyFile,directory,password}=input;
  if(typeof password!=='string' || password.length<18) throw Error('PASSWORD');
  const key=JSON.parse(fs.readFileSync(keyFile,'utf8').replace(/^\uFEFF/,''));
  if(key.project_id!=='ciclovia-per-la-vita' || key.type!=='service_account' || typeof key.private_key!=='string' || typeof key.client_email!=='string') throw Error('PROJECT');
  const destination=fs.realpathSync(directory);
  // Impedisce backup dentro QUALSIASI checkout Git, anche tramite junction.
  for(let current=destination;;current=path.dirname(current)) {
    if(fs.existsSync(path.join(current,'.git'))) throw Error('DESTINATION');
    if(path.dirname(current)===current) break;
  }
  const repo=fs.realpathSync(path.join(__dirname,'..'));
  const relative=path.relative(repo,destination);
  if(!relative || (!relative.startsWith('..'+path.sep) && relative!=='..' && !path.isAbsolute(relative))) throw Error('DESTINATION');
  if(path.basename(destination).toLowerCase()!=='backup_ciclovia') throw Error('DESTINATION');
  const names=['FIREBASE_SERVICE_ACCOUNT_FILE','CICLOVIA_BACKUP_DIR','CICLOVIA_BACKUP_PASSPHRASE'];
  const old=names.map(n=>process.env[n]);
  try {
    process.env.FIREBASE_SERVICE_ACCOUNT_FILE=keyFile;
    process.env.CICLOVIA_BACKUP_DIR=destination;
    process.env.CICLOVIA_BACKUP_PASSPHRASE=password;
    const result=await (backup||require('./backup-adesioni.cjs').main)({quiet:true});
    const checked=(verify||require('./restore-adesioni.cjs').verifyBackup)(result.file,password);
    if(checked.count!==result.count || !Number.isSafeInteger(result.count) || result.count<0) throw Error('VERIFY');
    return {ok:true,count:result.count};
  } finally {
    names.forEach((n,i)=>{if(old[i]===undefined)delete process.env[n];else process.env[n]=old[i];});
    input.password='';
  }
}
async function main() {
  let raw='';for await(const chunk of process.stdin){raw+=chunk;if(raw.length>65536)throw Error('INPUT');}
  const input=JSON.parse(raw);raw='';
  process.stdout.write(JSON.stringify(await run(input)));
}
if(require.main===module) main().catch(()=>{process.stdout.write(JSON.stringify({ok:false}));process.exitCode=1;});
module.exports={run};
