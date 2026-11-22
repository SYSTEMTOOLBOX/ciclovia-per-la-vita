'use strict';
// Diagnostica read-only locale delle adesioni. NON stampa nomi, email, UID
// o password; non salva esportazioni e non modifica Firebase.
// Eseguire solo sul PC del promotore con un service account autorizzato
// a leggere Firebase Authentication e Firestore (non riusare quello di sola
// lettura del contatore, se non ha i permessi Auth necessari).
const fs = require('node:fs');
const admin = require('firebase-admin');
const PROJECT = 'ciclovia-per-la-vita';

async function main() {
  const filename = process.env.FIREBASE_SERVICE_ACCOUNT_FILE;
  if (!filename) throw new Error('Imposta FIREBASE_SERVICE_ACCOUNT_FILE su un file locale privato.');
  const credential = JSON.parse(fs.readFileSync(filename,'utf8'));
  if (credential.project_id !== PROJECT) throw new Error('Il file credenziali appartiene a un progetto diverso.');
  const app = admin.initializeApp({
    credential: admin.credential.cert(credential),
    projectId: PROJECT,
  }, 'audit-adesioni-locale');
  try {
    // Raccolta UID in memoria; solo numeri aggregati in stdout.
    const users = new Map();
    let nextPageToken;
    do {
      const page = await admin.auth(app).listUsers(1000, nextPageToken);
      for (const u of page.users) users.set(u.uid, Boolean(u.emailVerified));
      nextPageToken = page.pageToken;
    } while (nextPageToken);

    const docs = await admin.firestore(app).collection('adesioni').get();
    let savedWithVerifiedEmail = 0, savedWithUnverifiedEmail = 0, orphanDocuments = 0;
    let brokenAdhesionSchema = 0;
    const savedUids = new Set();
    for (const doc of docs.docs) {
      savedUids.add(doc.id);
      const v = users.get(doc.id);
      if (v === true) savedWithVerifiedEmail++;
      else if (v === false) savedWithUnverifiedEmail++;
      else orphanDocuments++;
      const d = doc.data();
      if (!d || d.consensoEsplicito !== true || d.maggiorenne !== true ||
          typeof d.nome !== 'string' || typeof d.cognome !== 'string' ||
          typeof d.comune !== 'string' || typeof d.email !== 'string' ||
          !d.creataIl) brokenAdhesionSchema++;
    }
    let verifiedWithoutAdhesion = 0, pendingEmailWithoutAdhesion = 0;
    for (const [uid,verified] of users) {
      if (!savedUids.has(uid)) {
        if (verified) verifiedWithoutAdhesion++;
        else pendingEmailWithoutAdhesion++;
      }
    }

    const summary = {
      timestamp: new Date().toISOString(),
      project: PROJECT,
      accountTotali: users.size,
      emailVerificate: [...users.values()].filter(Boolean).length,
      emailNonVerificate: [...users.values()].filter(v => !v).length,
      adesioniFirestore: docs.size,
      adesioniConEmailAttualmenteVerificata: savedWithVerifiedEmail,
      adesioniConEmailNonVerificata: savedWithUnverifiedEmail,
      adesioniSenzaAccount: orphanDocuments,
      documentiConCampiObbligatoriMancanti: brokenAdhesionSchema,
      accountVerificatiSenzaAdesione: verifiedWithoutAdhesion,
      accountInAttesaEmailSenzaAdesione: pendingEmailWithoutAdhesion,
      contieneDatiPersonali: false,
      nota: 'Gli account di prova possono comparire tra i non aderenti. Nessuna cancellazione eseguita.',
    };
    console.log(JSON.stringify(summary, null, 2));
    if (orphanDocuments || brokenAdhesionSchema) process.exitCode = 2;
  } finally {
    await app.delete();
  }
}
main().catch(() => {
  // Non stampare eccezioni SDK che possono includere dettagli di configurazione.
  console.error('Diagnostica non completata. Controlla i permessi Auth e Firestore del service account locale.');
  process.exitCode = 1;
});
