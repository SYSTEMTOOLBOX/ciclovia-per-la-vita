'use strict';
// Controlli statici senza rete e senza accesso a dati personali.
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const fail = message => { throw new Error(message); };
const pages = ['index.html', 'adesioni.html', 'prova-email.html', 'privacy.html'];
let references = 0;

for (const page of pages) {
  const html = read(page);
  if (!html.includes('lang="it"')) fail(page + ': lingua italiana mancante');
  if (!html.includes('<title>')) fail(page + ': titolo mancante');
  for (const match of html.matchAll(/\b(?:href|src|poster)=["']([^"']+)["']/g)) {
    const value = match[1];
    if (/^(?:https?:|mailto:|tel:|data:|#)/i.test(value)) continue;
    const file = value.split(/[?#]/, 1)[0].replace(/^\.\//, '');
    if (!file) continue;
    const target = path.resolve(root, file);
    if (!(target === root || target.startsWith(root + path.sep))) fail(page + ': percorso non sicuro ' + value);
    if (!fs.existsSync(target)) fail(page + ': risorsa mancante ' + value);
    references++;
  }
}

const home = read('index.html');
const adh = read('adesioni.html');
const trial = read('prova-email.html');
const policy = read('privacy.html');
const rules = read('firestore.rules');
const count = JSON.parse(read('adesioni-count.json'));
const version = (policy.match(/Versione\s*<strong>([^<]+)<\/strong>/) || [])[1];
if (!version) fail('Versione privacy non trovata');
if (!adh.includes('privacyVersion:"' + version + '"')) fail('Versione privacy non coerente con adesioni.html');
if (!rules.includes("d.privacyVersion == '" + version + "'")) fail('Versione privacy non coerente con firestore.rules');
if (!adh.includes('id="consenso" type="checkbox" required')) fail('Manca la casella di consenso esplicito');
if (!adh.includes('launchEnabled === true')) fail('Manca la protezione di apertura del modulo');
if (adh.includes('trialMode') || adh.includes('collaudo-warning')) fail('Modalita di collaudo ancora attiva nel modulo pubblico');
if (rules.includes('collectionTestAllowed') || rules.includes('testEmails')) fail('Permessi di collaudo ancora attivi sul backend');
if (!home.includes('stato-raccolta-home') || !policy.includes('privacy-stato-titolo')) fail('Le etichette di apertura pubblica non si aggiornano');
if (!adh.includes('getDocFromServer(target)') || !adh.includes('const confirmed = await getDocFromServer(target)')) {
  fail('Manca il controllo sul server prima della conferma adesione');
}
if (!adh.includes('if (prior.exists())') || !adh.includes('if (existing.exists())')) {
  fail('Manca la protezione di recupero adesioni gia salvate');
}
if (!adh.includes('Account creato, ma la richiesta di email non è riuscita')) {
  fail('Manca il recupero in caso di email di verifica non inviata');
}
// Controlla la sintassi del modulo JavaScript senza eseguirlo e senza accesso Firebase.
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const script = (adh.match(/<script type="module">([\s\S]*?)<\/script>/) || [])[1];
if (!script) fail('Modulo JavaScript di adesione mancante');
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ciclovia-check-'));
const tmpFile = path.join(tmpDir, 'adesioni.mjs');
try {
  fs.writeFileSync(tmpFile, script, 'utf8');
  const syntax = spawnSync(process.execPath, ['--check', tmpFile], {encoding:'utf8', timeout:10000});
  if (syntax.status !== 0) fail('Sintassi JavaScript adesioni non valida: ' + (syntax.stderr || '').slice(0,400));
} finally {
  fs.rmSync(tmpDir, {recursive:true,force:true});
}
if (!trial.includes('Non vengono richiesti nome, cognome o Comune')) fail('Etichetta di test mancante');
if (!home.includes('href="adesioni.html"') || !home.includes('href="privacy.html"')) fail('Collegamenti principali mancanti');
if (!rules.includes('allow list: if false;') || !rules.includes('allow update: if false;')) fail('Permessi Firestore non sufficientemente stretti');
if (typeof count.status !== 'string') fail('Stato conteggio mancante');
if (Object.keys(count).some(k => !['status', 'count', 'updatedAt', 'description'].includes(k))) fail('Il contatore contiene campi inattesi');
const segments = Array.from({length:16}, (_, i) => 'assets/intro/segment-' + String(i).padStart(2, '0') + '.bin');
const size = segments.reduce((n, f) => n + fs.statSync(path.join(root, f)).size, 0);
if (size !== 8209875) fail('Video introduttivo incompleto: ' + size + ' byte');
console.log('OK: 4 pagine, ' + references + ' risorse locali, privacy ' + version + ', video ' + size + ' byte.');
console.log('NOTA: il test statico non sostituisce il collaudo Firebase dei permessi e delle cancellazioni.');
