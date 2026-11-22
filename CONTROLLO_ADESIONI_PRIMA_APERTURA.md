# Nessuna adesione persa — controllo prima dell'apertura pubblica (22 novembre 2026)

> **Stato:** preparazione e revisione. NON è una certificazione di affidabilità, né autorizza a cambiare \`launchEnabled\` a \`true\`.

## Differenza che ha creato il problema con Yahoo
### Collaudo del ramo PR #3, 22 novembre 2026

Superati 14 test automatici del modulo, contatore e cifratura; 6 test su emulatori
Firebase isolati per regole, invii concorrenti, verifica email e ripristino;
superato anche il controllo statico delle 4 pagine. I tre import Firebase CDN
13.3.0 rispondono HTTP 200. Nessun account o adesione di produzione modificato.

Le nuove regole aggiungono un interruttore server chiuso per impostazione
predefinita. Non sono state distribuite in produzione. `launchEnabled` resta falso.
Procedura eseguibile, limiti e protezioni: [RIPRISTINO_ADESIONI.md](RIPRISTINO_ADESIONI.md).

Restano da verificare con accesso autorizzato: configurazione/regole effettivamente
pubblicate, audit aggregato dei dati esistenti, consegna Yahoo reale, backup dei
dati reali con ripristino isolato e primo run del contatore con il secret configurato.
Il test Auth emulato non invia posta e non prova la consegna Yahoo.
Non considerare la raccolta pronta all'apertura prima di queste verifiche.

### Account e adesione
1. **Authentication** può contenere un utente creato anche se l'email di verifica non arriva. È solo un ACCOUNT.
2. \`emailVerified\` significa che l'indirizzo è stato verificato.
3. La vera adesione esiste SOLO se è presente il documento \`adesioni/{uid}\` in Firestore. Il pulsante di conferma appare solo dopo la verifica email e il consenso esplicito.
4. Lo script \`prova-email.html\` crea solo utenti di prova, **mai** adesioni. Non contarli.
5. La collezione \`adesioni\` è la fonte per il contatore aggregato; il sito non pubblica identità o email.

L'email non arrivata a Yahoo NON equivale a un'adesione persa: la persona potrebbe non avere mai potuto completare la procedura. Spiegarglielo e permettergli login + reinvio; non registrarla manualmente come aderente senza consenso e conferma.

## Correzione nella PR di hardening
- La pagina distingue "account creato" da "email richiesta" e da "adesione verificata nel database".
- Se l'invio email non riesce, il percorso di reinvio resta disponibile.
- Le letture dell'adesione sono fatte forzando Firestore SERVER, non cache.
- Prima di salvare controlla se l'adesione esiste già; dopo il salvataggio verifica che il documento sia visibile nel server.
- Se il salvataggio sembra fallire per rete intermittente, controlla sul server se il documento è comparso; se non può verificarlo, non presenta una falsa conferma e conserva i campi del modulo.
- L'identificativo del documento è l'UID dell'utente: nessuna nuova adesione per semplici tentativi ripetuti.
- Le regole Firestore **non sono state cambiate** in questa PR; non si contano account non verificati.

## Da eseguire SUL PROGETTO FIREBASE REALE — senza copiare credenziali in chat/GitHub
1. Firebase console → Authentication → Users: conta utenti **email verificata / non verificata**, senza pubblicare identità.
2. Firebase console → Firestore Database → Data → \`adesioni\`: conta i documenti. **Solo quelli sono adesioni confermate**.
3. Per un confronto aggregato più rigoroso, sul PC privato usa \`node scripts/audit-adesioni.cjs\` con \`FIREBASE_SERVICE_ACCOUNT_FILE\` che punta a un account di servizio locale avente permesso **read-only** su Authentication + Firestore. Lo script stampa solo conteggi, non nomi/email/UID, e non modifica nulla. NON inserire la credenziale in repository, Actions, chat o screenshot.
4. Firebase console → Firestore → Rules: controlla che le regole pubblicate corrispondano al file \`firestore.rules\`; poi TESTA davvero con 2 utenti diversi che non si possano leggere o elencare dati altrui. Le regole nel repo non bastano.
5. Fai **almeno due prove complete** con indirizzi diversi, incluso Yahoo: registrazione → email arrivata → verifica → compilazione/consenso → conferma sul SERVER → nuova sessione → pannello "Hai già aderito" → revoca di prova e cancellazione account. Le prove NON devono rimanere conteggiate.
6. **Backup cifrato**: script esistente \`scripts/backup-adesioni.cjs\` da lanciare sul PC privato con credenziale locale, cartella esterna al repository e passphrase non inferiore a 18 caratteri. Lo script rilegge/verifica la decrittazione, ma **non costituisce ancora un vero ripristino**.
7. Conservare almeno due copie cifrate in luoghi separati; prevedere una procedura per recuperare anche gli account Firebase Authentication/UID, non solo i documenti Firestore; prova reale di ripristino in ambiente isolato PRIMA di promettere assenza di perdite. Rispettare eliminazioni richieste e tempi di conservazione anche nei backup.
8. Contatore: su GitHub → Actions → Aggiorna totale anonimo → Run workflow → \`main\` → \`test_connection = true\`. Il risultato deve avere il passo **"Calcola totale senza esportare dati personali" eseguito**, non "skipped". La sola dicitura "workflow success" non dimostra niente: quando la raccolta è chiusa può saltare apposta il contatore.
9. Prima apertura: solo dopo verifiche e backup, merge di questa PR, pubblicazione, e poi cambio \`launchEnabled\` con conferma del promotore; verifica dati e contatore da smartphone e PC. Non cancellare manualmente account o adesioni di terzi.

## Limiti onesti
- Nessun sistema online può garantire tecnicamente "zero perdite" al 100%, ma conferme server + backup verificati + recovery testato riducono molto il rischio.
- I documenti Firestore non sono firme autenticate legalmente.
- Al 22/11, \`adesioni-count.json\` pubblica ancora \`status: pending\`; il workflow automatico è "success" ma il calcolo effettivo è **skipped** per raccolta chiusa o credenziale non presente. Non sbloccare \`launchEnabled\` solo per ottenere una cifra.
- Questa PR non può verificare direttamente il progetto Firebase, i segreti GitHub o la consegna Yahoo senza l'accesso/consenso e i collaudi descritti.
- Attenzione al trattamento di dati potenzialmente rivelatori di opinioni politiche: mantenere minimizzazione, consenso esplicito, informativa corretta, log e backup protetti.
