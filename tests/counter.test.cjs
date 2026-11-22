const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../counter-adesioni.js'),'utf8');
async function render(data,fail=false) {
  const count={},date={};
  await vm.runInNewContext(source,{document:{querySelectorAll:s=>s==='[data-adesioni-count]'?[count]:[date]},fetch:async()=>{if(fail)throw Error();return {ok:true,json:async()=>data};},Intl,Date});
  return {count:count.textContent,date:date.textContent};
}
test('mostra conteggio verificato, incluso zero reale',async()=>{
  for(const count of [0,1234]) assert.equal((await render({status:'verified',count,updatedAt:new Date().toISOString()})).count,new Intl.NumberFormat('it-IT').format(count));
});
test('non inventa totali con rete assente, dati invalidi o obsoleti',async()=>{
  for(const value of [-1,1.5,'5']) assert.equal((await render({status:'verified',count:value,updatedAt:new Date().toISOString()})).count,'Non disponibile');
  assert.equal((await render({status:'verified',count:1,updatedAt:'2000-01-01'})).count,'Non disponibile');
  assert.match((await render(null,true)).date,/temporaneamente/);
});
