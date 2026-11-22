const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../adesioni.html'),'utf8');
const original=html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];
async function setup({writeError,readError,lostAck=false,readAfterWriteError=false,existing=false,verified=true,mailError=false,closed=false}={}) {
  const elements=new Map();let saved=existing,writes=0,resets=0;
  function el(id){if(!elements.has(id))elements.set(id,{value:'Test',checked:true,hidden:true,textContent:'',classList:{toggle(){}},scrollIntoView(){},checkValidity:()=>true,reportValidity:()=>true,addEventListener(event,fn){this[event]=fn;},reset(){resets++;}});return elements.get(id);}
  const user={uid:'test',email:'synthetic@example.test',emailVerified:verified,getIdToken:async()=>''};
  const sdk=[{initializeApp:()=>({})},{getAuth:()=>({currentUser:user}),onAuthStateChanged(){},reload:async()=>{},createUserWithEmailAndPassword:async()=>({user}),sendEmailVerification:async()=>{if(mailError)throw {code:'auth/too-many-requests'};}},{getFirestore:()=>({}),doc:()=>({}),getDocFromServer:async()=>{if(readError || (saved && readAfterWriteError))throw {code:'unavailable'};return {exists:()=>saved,data:()=>({nome:'Test'})};},runTransaction:async(db,fn)=>{writes++;if(writeError)throw {code:'permission-denied'};await fn({get:async()=>({exists:()=>saved}),set:()=>{saved=true;}});if(lostAck)throw {code:'unavailable'};},serverTimestamp:()=>({})}];
  const script=original.replace(/import \{ firebaseConfig, launchEnabled \} from "\.\/firebase-config.js";/,'').replace(/await Promise\.all\(\[[\s\S]*?\]\)/,'sdk');
  const context={firebaseConfig:{apiKey:'demo',authDomain:'demo',projectId:'demo',appId:'demo'},launchEnabled:!closed,sdk,document:{getElementById:el,querySelectorAll:()=>[]},console:{warn(){}},confirm:()=>false};
  await vm.runInNewContext('(async()=>{'+script+'})()',context);
  async function submit(){el('adhesion-form').submit({preventDefault(){}});await new Promise(resolve=>setImmediate(resolve));}
  return {el,submit,state:()=>({saved,writes,resets})};
}
test('modulo chiuso non registra gestori di invio',async()=>{
  const h=await setup({closed:true});assert.equal(h.el('setup').hidden,false);assert.equal(h.el('adhesion-form').submit,undefined);
});
test('conferma solo dopo salvataggio e lettura server; retry senza duplicati',async()=>{
  const h=await setup();await h.submit();assert.match(h.el('feedback').textContent,/Adesione verificata/);assert.equal(h.state().writes,1);
  await h.submit();assert.equal(h.state().writes,1);
});
test('scrittura negata o server irraggiungibile non confermano e non cancellano campi',async()=>{
  for(const options of [{writeError:true},{readError:true},{verified:false}]){
    const h=await setup(options);await h.submit();assert.equal(h.state().resets,0);assert.equal(h.state().saved,false);assert.doesNotMatch(h.el('feedback').textContent,/Adesione verificata/);
  }
});
test('fallimento email conserva account e propone reinvio senza confermare adesione',async()=>{
  const h=await setup({verified:false,mailError:true});await h.el('create-account').click();
  assert.match(h.el('feedback').textContent,/Account creato, ma/);assert.equal(h.el('verification').hidden,false);assert.equal(h.state().writes,0);
});
test('adesione propria visibile anche con email non verificata e account cancellabile',async()=>{
  const h=await setup({verified:false,existing:true});
  await h.el('check-verification').click();
  assert.equal(h.el('existing-adhesion').hidden,false);
  assert.match(h.el('existing-details').textContent,/non verificata/);
  assert.ok(h.el('delete-account-panel'));
  // Il pulsante di cancellazione e' disponibile anche durante la verifica.
  assert.match(html,/id="verification"[\\s\\S]*?delete-account/);
});
test('risposta persa recuperata solo se la lettura server conferma',async()=>{
  const h=await setup({lostAck:true});await h.submit();
  assert.match(h.el('feedback').textContent,/Adesione verificata/);assert.equal(h.state().writes,1);
  const uncertain=await setup({readAfterWriteError:true});await uncertain.submit();
  assert.equal(uncertain.state().saved,true);assert.equal(uncertain.state().resets,0);
  assert.doesNotMatch(uncertain.el('feedback').textContent,/Adesione verificata/);
});
