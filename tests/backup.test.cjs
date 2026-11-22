const {test}=require('node:test');
const assert=require('node:assert/strict');
const {encrypt,decrypt,validate,encode,decode}=require('../scripts/backup-codec.cjs');
const {Timestamp,GeoPoint}=require('firebase-admin/firestore');
const password='solo-test-non-usare-in-produzione';
const fields={nome:'Test',creataIl:new Timestamp(1700000000,123456789),extra:[null,Buffer.from('abc'),new GeoPoint(45,7),{nested:true}],number:42};
const data={format:'ciclovia-adesioni-backup-v2',sourceProject:'ciclovia-per-la-vita',count:1,records:[{uid:'synthetic',fields:encode(fields)}]};
test('backup cifrato preserva campi e nanosecondi',()=>{
  const bytes=encrypt(data,password);
  assert.ok(!bytes.includes(Buffer.from('synthetic')));
  const restored=validate(decrypt(bytes,password));
  assert.deepEqual(restored,data);
  assert.deepEqual(decode(restored.records[0].fields,null,{Timestamp,GeoPoint}),fields);
  assert.notDeepEqual(encrypt(data,password),bytes);
});
test('password errata, file alterato o troncato vengono rifiutati',()=>{
  const bytes=encrypt(data,password);
  assert.throws(()=>decrypt(bytes,'password-errata-lunga'));
  for(const offset of [0,9,25,37,53,bytes.length-1]) {
    const altered=Buffer.from(bytes);altered[offset]^=1;
    assert.throws(()=>decrypt(altered,password));
  }
  assert.throws(()=>decrypt(bytes.subarray(0,40),password));
});
test('manifest incoerente e UID duplicati vengono rifiutati',()=>{
  assert.throws(()=>validate({...data,count:2}));
  assert.throws(()=>validate({...data,count:2,records:[...data.records,...data.records]}));
  assert.throws(()=>encrypt(data,'breve'));
});
