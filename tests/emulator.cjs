const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {initializeTestEnvironment,assertSucceeds,assertFails}=require('@firebase/rules-unit-testing');
const {doc,setDoc,getDoc,getDocs,collection,deleteDoc,updateDoc,serverTimestamp,runTransaction}=require('firebase/firestore');
const {initializeApp,deleteApp}=require('firebase/app');
const {getAuth,connectAuthEmulator,createUserWithEmailAndPassword,sendEmailVerification,applyActionCode,reload}=require('firebase/auth');
const admin=require('firebase-admin');
const {encrypt,decrypt,encode}=require('../scripts/backup-codec.cjs');
const {restore}=require('../scripts/restore-adesioni.cjs');
const projectId='demo-ciclovia-test';
let env;
before(async()=>{
  assert.match(process.env.FIRESTORE_EMULATOR_HOST||'',/^(127\.0\.0\.1|localhost):\d+$/);
  env=await initializeTestEnvironment({projectId,firestore:{rules:fs.readFileSync('firestore.rules','utf8')}});
});
after(async()=>{await env?.cleanup();});
function db(uid,verified=true){return env.authenticatedContext(uid,{email:uid+'@example.test',email_verified:verified}).firestore();}
function fields(uid){return {nome:'Test',cognome:'Sintetico',comune:'Torino',email:uid+'@example.test',consensoEsplicito:true,maggiorenne:true,privacyVersion:'2026-11-19-v2',creataIl:serverTimestamp()};}
test('raccolta chiusa sul server anche aggirando il flag JavaScript',async()=>{
  const own=db('closed');
  await assertFails(setDoc(doc(own,'adesioni/closed'),fields('closed')));
  await assertFails(setDoc(doc(own,'config/raccolta'),{enabled:true}));
  await env.withSecurityRulesDisabled(async c=>setDoc(doc(c.firestore(),'config/raccolta'),{enabled:false}));
  await assertFails(setDoc(doc(own,'adesioni/closed'),fields('closed')));
});
test("l'interruttore di vecchio collaudo non può più consentire adesioni",async()=>{
  const allowed = db('allowed');
  await env.withSecurityRulesDisabled(async c =>
    setDoc(doc(c.firestore(),'config/collaudo'),{
      enabled:true, testEmails:['allowed@example.test']
    })
  );
  await assertFails(setDoc(doc(allowed,'adesioni/allowed'),fields('allowed')));
  await assertFails(getDoc(doc(allowed,'config/collaudo')));
  await assertFails(setDoc(doc(allowed,'config/collaudo'),{enabled:true}));
  // Solo l'interruttore di apertura ufficiale può dare accesso alle nuove adesioni.
  await env.withSecurityRulesDisabled(async c =>
    setDoc(doc(c.firestore(),'config/raccolta'),{enabled:true})
  );
});
test('regole: anonimi, non verificati e altri utenti esclusi',async()=>{
  const own=db('owner');
  await assertSucceeds(setDoc(doc(own,'adesioni/owner'),fields('owner')));
  await assertSucceeds(getDoc(doc(own,'adesioni/owner')));
  // Sui documenti propri la lettura e la revoca rimangono disponibili
  // anche se la verifica email viene persa; creare nuove adesioni no.
  const ownNotVerified = db('owner',false);
  await assertSucceeds(getDoc(doc(ownNotVerified,'adesioni/owner')));
  await assertFails(setDoc(doc(ownNotVerified,'adesioni/unverified'),fields('owner')));
  await assertFails(getDocs(collection(ownNotVerified,'adesioni')));
  for(const other of [env.unauthenticatedContext().firestore(),db('other')]) {
    await assertFails(getDoc(doc(other,'adesioni/owner')));
    await assertFails(setDoc(doc(other,'adesioni/forbidden'),fields('other')));
    await assertFails(getDocs(collection(other,'adesioni')));
  }
  await assertFails(getDocs(collection(own,'adesioni')));
  await assertFails(updateDoc(doc(own,'adesioni/owner'),{nome:'Alterato'}));
  await assertFails(setDoc(doc(own,'adesioni/owner'),fields('owner')));
  await assertFails(deleteDoc(doc(db('other'),'adesioni/owner')));
  await assertSucceeds(deleteDoc(doc(db('owner',false),'adesioni/owner')));
});
test('regole: schema, consenso, timestamp, email e collezioni estranee',async()=>{
  const own=db('schema'),target=doc(own,'adesioni/schema');
  for(const changes of [{nome:''},{nome:'a'.repeat(61)},{consensoEsplicito:false},{maggiorenne:false},{email:'other@example.test'},{privacyVersion:'old'},{creataIl:new Date(0)},{extra:true}]) {
    await assertFails(setDoc(target,{...fields('schema'),...changes}));
  }
  const missing=fields('schema');delete missing.comune;
  await assertFails(setDoc(target,missing));
  await assertFails(setDoc(doc(own,'private/schema'),fields('schema')));
});
test('due invii concorrenti producono un solo documento',async()=>{
  const own=db('retry'),target=doc(own,'adesioni/retry');
  const send=()=>runTransaction(own,async t=>{if(!(await t.get(target)).exists())t.set(target,fields('retry'));});
  await Promise.all([send(),send()]);await send();
  await assertSucceeds(getDoc(target));
  await env.withSecurityRulesDisabled(async c=>assert.equal((await getDocs(collection(c.firestore(),'adesioni'))).size,1));
});
test('Authentication: verifica email e rinnovo token (casella Yahoo sintetica, nessun invio reale)',async()=>{
  const app=initializeApp({apiKey:'demo-key',projectId},'auth-test');
  const auth=getAuth(app);connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});
  try {
    const {user}=await createUserWithEmailAndPassword(auth,'ciclovia-test@yahoo.com','synthetic-test-password');
    assert.equal(user.emailVerified,false);
    await sendEmailVerification(user);
    const res=await fetch('http://127.0.0.1:9099/emulator/v1/projects/'+projectId+'/oobCodes');
    const codes=(await res.json()).oobCodes;
    await applyActionCode(auth,codes.find(c=>c.email===user.email&&c.requestType==='VERIFY_EMAIL').oobCode);
    await reload(user);assert.equal(user.emailVerified,true);
    assert.equal((await user.getIdTokenResult(true)).claims.email_verified,true);
  } finally {await deleteApp(app);}
});
test('backup cifrato ripristinato e riletto senza sovrascritture',async()=>{
  const app=admin.initializeApp({projectId},'restore-test');
  const store=admin.firestore(app);
  try {
    // Solo emulatori demo: i dati del test precedente vengono mantenuti.
    const snapshot=await store.collection('adesioni').get();
    const data={format:'ciclovia-adesioni-backup-v2',sourceProject:'ciclovia-per-la-vita',count:snapshot.size,records:snapshot.docs.map(d=>({uid:d.id,fields:encode(d.data())}))};
    const targetApp=admin.initializeApp({projectId:'demo-ciclovia-restore'},'restore-target');
    try {
      const target=admin.firestore(targetApp);
      const restored=decrypt(encrypt(data,'synthetic-backup-passphrase'),'synthetic-backup-passphrase');
      assert.equal(await restore(target,restored,admin.firestore),data.count);
      await assert.rejects(()=>restore(target,restored,admin.firestore),/non vuota/);
      assert.equal((await target.collection('adesioni').get()).size,data.count);
    } finally {await targetApp.delete();}
  } finally {await app.delete();}
});
