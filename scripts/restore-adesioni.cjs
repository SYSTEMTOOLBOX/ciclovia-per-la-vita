'use strict';
const fs = require('node:fs');
const {isDeepStrictEqual} = require('node:util');
const {decrypt,validate,encode,decode} = require('./backup-codec.cjs');

async function restore(db, data, types) {
  validate(data);
  // Prepara tutti i valori prima di qualsiasi scrittura.
  const records = data.records.map(r=>({uid:r.uid, fields:decode(r.fields,db,types)}));
  if (!(await db.collection('adesioni').limit(1).get()).empty) throw new Error('Destinazione non vuota: nessuna sovrascrittura consentita.');
  for (let i=0;i<records.length;i+=400) {
    const batch=db.batch();
    for (const r of records.slice(i,i+400)) batch.create(db.collection('adesioni').doc(r.uid),r.fields);
    await batch.commit();
  }
  const snapshot=await db.collection('adesioni').get();
  const expected=new Map(data.records.map(r=>[r.uid,r.fields]));
  if(snapshot.size!==data.count || snapshot.docs.some(d=>!isDeepStrictEqual(encode(d.data()),expected.get(d.id)))) {
    throw new Error('Verifica ripristino fallita.');
  }
  return snapshot.size;
}
async function main() {
  const [filename,mode='--verify-only']=process.argv.slice(2);
  if (!filename || !['--verify-only','--restore'].includes(mode)) throw new Error('Uso: node scripts/restore-adesioni.cjs FILE [--verify-only|--restore]');
  const data=validate(decrypt(fs.readFileSync(filename),process.env.CICLOVIA_BACKUP_PASSPHRASE));
  if(mode==='--verify-only') {console.log('Integrita backup verificata. Documenti:',data.count);return;}
  const projectId=process.env.CICLOVIA_RESTORE_PROJECT;
  if(!projectId || projectId==='ciclovia-per-la-vita' || process.env.CICLOVIA_CONFIRM_RESTORE!==projectId) throw new Error('Ripristino consentito solo su progetto isolato esplicitamente confermato.');
  const admin=require('firebase-admin');
  let options={projectId};
  if(process.env.FIRESTORE_EMULATOR_HOST) {
    if(!/^127\.0\.0\.1:\d+$/.test(process.env.FIRESTORE_EMULATOR_HOST) || !projectId.startsWith('demo-')) throw new Error('Emulatore non locale.');
  } else {
    const key=JSON.parse(fs.readFileSync(process.env.FIREBASE_SERVICE_ACCOUNT_FILE,'utf8'));
    if(key.project_id!==projectId) throw new Error('Credenziale per progetto errato.');
    options.credential=admin.credential.cert(key);
  }
  const app=admin.initializeApp(options);
  try { console.log('Ripristino verificato. Documenti:',await restore(admin.firestore(app),data,admin.firestore)); }
  finally {await app.delete();}
}
if(require.main===module) main().catch(()=>{console.error('Ripristino non completato. Verificare passphrase, manifest e progetto isolato; non riutilizzare una destinazione parzialmente ripristinata.');process.exitCode=1;});
module.exports={restore};
