# Attivazione e verifiche — Una ciclovia per la vita

**Stato al 19 novembre 2026: raccolta NON attiva.**
Branch di lavoro: `feature/adesioni-online-firebase-20261117`.
La versione pubblica del sito su GitHub Pages non registra adesioni.

## A. Collegamento sicuro a Firebase (richiede accesso del titolare)

1. Aprire https://console.firebase.google.com/ con l'account amministratore del titolare.
2. Creare un progetto **dedicato esclusivamente alla ciclovia**, possibilmente con piano Spark; non riutilizzare altri progetti né inserire dati personali in progetti di prova.
3. In **Authentication → Sign-in method** attivare **Email/Password**. In Authentication → Settings → Authorized domains verificare che sia autorizzato `systemtoolbox.github.io`.
4. In **Firestore Database** creare il database di produzione, selezionando una **regione UE** prima della creazione. Non attivare regole di lettura pubblica.
5. In **Firestore → Rules** copiare integralmente il file `firestore.rules` dal branch di sviluppo, pubblicare le regole e **provarle con l'emulatore**. Le regole consentono una sola adesione per UID; gli utenti non possono elencare le adesioni né modificarle.
6. In **Impostazioni progetto → Le tue app → Web app** registrare il sito, copiare i valori della configurazione web in `firebase-config.js`. Sono campi pubblici di progetto, NON chiavi di amministratore. **Non caricare password, token, service account o chiavi private su GitHub**.
7. Durante ogni configurazione e prova mantenere `launchEnabled = false`. Il modulo non è pubblicamente attivo e non deve essere segnalato come raccolta avviata.

## B. Privacy e conservazione — da completare prima di raccogliere dati reali

- [ ] Controllare e documentare quale account Google amministra il servizio e chi può accedere ai dati; attivare autenticazione multifattore per l'amministratore.
- [ ] Verificare condizioni Firebase/GitHub, eventuali accordi sul trattamento, ruoli dei fornitori, subfornitori e trasferimenti extra-SEE. La collocazione UE di Firestore non basta da sola.
- [ ] Verificare informativa `privacy.html` (versione `2026-11-19-v2`) e basi giuridiche con un professionista se necessario, in particolare per l'eventuale dato relativo a opinioni politiche.
- [ ] Definire la data e la modalità di chiusura della campagna. Cancellare le adesioni nominative al massimo entro 12 mesi dalla chiusura.
- [ ] Predisporre un controllo amministrativo di Firebase Authentication per eliminare account **con email non verificata dopo 90 giorni dalla creazione** e **senza adesione dopo 90 giorni di inattività**, senza cancellare gli account con adesioni ancora valide. Questa procedura **non è automatica** e deve essere operativa prima dell'apertura.
- [ ] Definire una procedura per richieste degli interessati inviate a `kaironlabsstudio@gmail.com`; verificare ragionevolmente l'identità di chi chiede accesso o cancellazione, rispondere nei termini GDPR e non inviare elenchi via email non protetta.
- [ ] Rivedere eventuali dati di log/cookie e backup del fornitore. I nomi degli aderenti non devono essere pubblicati o ceduti.
- [ ] Considerare l'uso di Firebase App Check, limiti di abuso e controlli delle quote senza raccogliere dati inutili.

## C. Collaudo con DUE account di prova (NON dati reali di cittadini)

- [ ] Verificare che il link alla privacy sia visibile **prima** di premere Registrati.
- [ ] Verificare che non si possa creare un account senza dichiarare la maggiore età.
- [ ] Verificare registrazione e consegna dell'email di verifica (incluso controllo spam).
- [ ] Verificare impossibilità di salvare un'adesione con email non verificata.
- [ ] Verificare che la casella di **consenso esplicito** non sia preselezionata.
- [ ] Verificare salvataggio di nome, cognome, Comune e versione `2026-11-19-v2`.
- [ ] Verificare che lo stesso account non possa modificare o duplicare la propria adesione.
- [ ] Verificare che l'account A non possa leggere l'adesione di B né l'intera collezione.
- [ ] Verificare impossibilità di scrivere campi extra, modificare email, saltare i controlli o impostare una vecchia versione privacy.
- [ ] Verificare revoca dell'adesione senza cancellazione obbligatoria dell'account.
- [ ] Verificare il percorso **Elimina account**: riautenticazione password, cancellazione adesione e cancellazione dell'utente Auth. Una password sbagliata non deve revocare l'adesione.
- [ ] Provare il comportamento in caso di rete assente, email non consegnata, password errata, sessione scaduta e errori Firebase.
- [ ] Eliminare account di prova e relativi dati alla fine delle verifiche.

## D. Apertura pubblica, solo dopo il superamento dei controlli

1. Controllare che privacy, testo del modulo e regole Firestore usino la stessa versione.
2. Inserire i parametri Firebase verificati nella configurazione web.
3. Impostare esplicitamente `launchEnabled = true` **solo dopo l'esito positivo del collaudo**.
4. Revisionare e unire il branch in `main`; verificare sul sito pubblico l'intero percorso.
5. Aggiornare la homepage per presentare il pulsante di adesione, senza chiamarla «firma autenticata».
6. Valutare il contatore pubblico solo tramite aggregazione protetta; **non aprire la lettura della collezione Firestore**.
7. Comunicare l'apertura soltanto a verifica conclusa.

**Limite sostanziale:** email verificata ≠ identità anagrafica certificata. Queste sono adesioni civiche. Per una petizione formalmente sottoscritta occorre seguire le procedure dell'ente destinatario.

## Note tecniche

- Il modulo usa Firebase JS SDK modulare `13.3.0`.
- `firestore.rules` limita `create`, `get`, `delete` all'account proprietario secondo le condizioni indicate; nega `list` e `update`.
- Una persona può creare più account con indirizzi diversi: il sistema non certifica l'unicità per persona.
- La cancellazione a scadenza non è presente nel codice del client e necessita di una procedura amministrativa.
- **Mai pubblicare nomi o email individuali nel repository pubblico.**
