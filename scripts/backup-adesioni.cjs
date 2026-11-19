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
const crypto = require('node:crypto');
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
      format:'ciclovia-adesioni-backup-v1',
      sourceProject:'ciclovia-per-la-vita',
      backedUpAt:new Date().toISOString(),
      count:snapshot.size,
      // I dati personali sono solo in memoria prima di essere cifrati.
      records:snapshot.docs.map(doc=>({uid:doc.id,fields:doc.data()}))
    };
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);
    const key = crypto.scryptSync(password,salt,32,{N:16384,r:8,p:1});
    const cipher = crypto.createCipheriv('aes-256-gcm',key,iv);
    const plaintext = Buffer.from(JSON.stringify(data),'utf8');
    const encrypted = Buffer.concat([cipher.update(plaintext),cipher.final()]);
    const tag = cipher.getAuthTag();
    const binary = Buffer.concat([Buffer.from('CICLOVIA1','ascii'),salt,iv,tag,encrypted]);

    const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
    const out = path.join(outputDir,'ciclovia-adesioni-'+timestamp+'.enc');
    fs.writeFileSync(out,binary,{flag:'wx',mode:0o600});
    // Verifica immediata del file cifrato (senza scrivere dati in chiaro).
    const check=fs.readFileSync(out);
    const decipher=crypto.createDecipheriv('aes-256-gcm',key,check.subarray(25,37));
    decipher.setAuthTag(check.subarray(37,53));
    const clear=Buffer.concat([decipher.update(check.subarray(53)),decipher.final()]);
    const parsed=JSON.parse(clear.toString('utf8'));
    if(parsed.format!=='ciclovia-adesioni-backup-v1' || parsed.count!==snapshot.size) {
      throw new Error('Verifica del backup non riuscita!');
    }
    console.log('Copia CIFRATA creata e verificata in locale:',out);
    console.log('Documenti salvati:',snapshot.size);
    console.log('Conserva la passphrase separatamente; senza di essa la copia non è recuperabile.');
  } finally {
    await app.delete();
  }
}
main().catch(err=>{
  console.error('Backup non completato:',err.message);
  process.exitCode=1;
});
