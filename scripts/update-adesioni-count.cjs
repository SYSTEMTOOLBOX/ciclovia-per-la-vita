'use strict';
// Aggiorna SOLO il conteggio aggregato pubblico. Non esporta nomi/email.
// Il workflow deve ricevere la credenziale FIREBASE_SERVICE_ACCOUNT_JSON
// esclusivamente tramite GitHub Actions Secrets (mai nel repository).
const fs = require('node:fs');
const admin = require('firebase-admin');

async function main() {
  const secret = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!secret) {
    console.log('Configurazione non ancora disponibile: nessun conteggio pubblicato.');
    return;
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
main().catch(err => {
  // Non stampare mai la credenziale o documenti Firestore nei log.
  console.error('Aggiornamento fallito:', err.message);
  process.exitCode = 1;
});
