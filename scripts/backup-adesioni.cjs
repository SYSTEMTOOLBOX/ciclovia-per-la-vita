'use strict';
// Backup OFFLINE CIFRATO delle adesioni Firestore.
// Non pubblicare mai file di output, service account o password su GitHub.
// Richiede npm install --no-save firebase-admin@13 (solo sul PC del titolare).
// Variabili d'ambiente:
// FIREBASE_SERVICE_ACCOUNT_FILE = percorso locale del JSON del service account
// CICLOVIA_BACKUP_PASSPHRASE = passphrase lunga, conservata fuori dal PC
// CICLOVIA_BACKUP_DIR = cartella locale FUORI dal repository GitHub
const fs = require('node:fs');
const path = require('node:path');
const {encrypt,decrypt,encode,validate} = require('./backup-codec.cjs');
const {isDeepStrictEqual} = require('node:util');
const admin = require('firebase-admin');

async function main() {
  const keyFile = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  const password = process.env.CICLOVIA_BACKUP_PASSPHRASE;
  const dest = process.env.CICLOVIA_BACKUP_DIR;
  if (!keyFile || !dest || !password || password.length < 18) {
    throw new Error('Mancano credenziale locale, cartella esterna o passphrase di almeno 18 caratteri.');
  }
  const outputDir = fs.realpathSync(dest);
  const repoRoot = path.resolve(__dirname,'..');
  if (outputDir === repoRoot || outputDir.startsWith(repoRoot + path.sep)) {
    throw new Error('La destinazione deve essere fuori dal repository GitHub!');
  }
  const keyData = JSON.parse(fs.readFileSync(keyFile,'utf8'));
  if (keyData.project_id !== 'ciclovia-per-la-vita') {
    throw new Error('Credenziale per progetto errato.');
  }
  const app = admin.initializeApp({
    credential: admin.credential.cert(keyData),
    projectId: 'ciclovia-per-la-vita'
  });
  try {
    const snapshot = await admin.firestore(app).collection('adesioni').get();
    const data = {
      format:'ciclovia-adesioni-backup-v2',
      sourceProject:'ciclovia-per-la-vita',
      backedUpAt:new Date().toISOString(),
      count:snapshot.size,
      // I dati personali sono solo in memoria prima di essere cifrati.
      records:snapshot.docs.map(doc=>({uid:doc.id,fields:encode(doc.data())}))
    };
    const binary = encrypt(validate(data),password);

    const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
    const out = path.join(outputDir,'ciclovia-adesioni-'+timestamp+'.enc');
    fs.writeFileSync(out,binary,{flag:'wx',mode:0o600});
    // Verifica immediata del file cifrato (senza scrivere dati in chiaro).
    const check=fs.readFileSync(out);
    const parsed=validate(decrypt(check,password));
    if(!isDeepStrictEqual(parsed,data)) {
      throw new Error('Verifica del backup non riuscita!');
    }
    console.log('Copia CIFRATA creata e verificata in locale:',out);
    console.log('Documenti salvati:',snapshot.size);
    console.log('Conserva la passphrase separatamente; senza di essa la copia non è recuperabile.');
  } finally {
    await app.delete();
  }
}
main().catch(()=>{
  console.error('Backup non completato. Verificare credenziale, destinazione esterna e passphrase.');
  process.exitCode=1;
});
