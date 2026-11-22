'use strict';
// Aggiorna SOLO il conteggio aggregato pubblico. Non esporta nomi/email.
// Il workflow deve ricevere la credenziale FIREBASE_SERVICE_ACCOUNT_JSON
// esclusivamente tramite GitHub Actions Secrets (mai nel repository).
const fs = require('node:fs');
const admin = require('firebase-admin');

async function main() {
  // Non pubblicare nemmeno il valore 0 finché la raccolta è chiusa.
  const config = fs.readFileSync('firebase-config.js', 'utf8');
  const publicActive = /export\s+const\s+launchEnabled\s*=\s*true\s*;/.test(config);
  const connectionTest = process.env.CICLOVIA_CONNECTION_TEST === '1';
  if (!publicActive && !connectionTest) {
    console.log('Raccolta ancora disattivata: nessun totale pubblicato.');
    return;
  }
  const secret = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!secret) {
    throw new Error('Credenziale del contatore mancante.');
  }
  let credentials;
  try { credentials = JSON.parse(secret); }
  catch { throw new Error('Credenziale Firebase non valida: JSON malformato.'); }
  if (credentials.project_id !== 'ciclovia-per-la-vita') {
    throw new Error('Progetto Firebase inatteso: aggiornamento annullato.');
  }
  const app = admin.initializeApp({
    credential: admin.credential.cert(credentials),
    projectId: 'ciclovia-per-la-vita'
  });
  try {
    const result = await admin.firestore(app).collection('adesioni').count().get();
    const total = result.data().count;
    if (!Number.isSafeInteger(total) || total < 0) throw new Error('Conteggio Firestore non valido.');
    if (connectionTest) {
      console.log('Test del collegamento Firebase riuscito. Raccolta chiusa: nessun conteggio pubblicato.');
      return;
    }
    fs.writeFileSync('adesioni-count.json', JSON.stringify({
      status: 'verified',
      count: total,
      updatedAt: new Date().toISOString(),
      description: 'Numero complessivo delle adesioni civiche registrate, non firme autenticate.'
    }, null, 2) + '\n', {encoding:'utf8',mode:0o644});
    console.log('Totale aggregato aggiornato. Nessun dato personale esportato.');
  } finally {
    await app.delete();
  }
}
main().catch(() => {
  // Non stampare mai la credenziale o documenti Firestore nei log.
  console.error('Aggiornamento fallito. Verificare configurazione e permessi del contatore.');
  process.exitCode = 1;
});
