# Backup e ripristino delle adesioni

La raccolta resta chiusa. Questi strumenti non attivano Firebase e non modificano
account Authentication. Il backup comprende la collezione Firestore `adesioni`;
non e' un backup completo del progetto o delle password degli account.

## Creazione e verifica

Eseguire `npm ci --ignore-scripts` nel checkout. Configurare in una sessione privata
`FIREBASE_SERVICE_ACCOUNT_FILE` (credenziale di sola lettura del progetto),
`CICLOVIA_BACKUP_DIR` (directory privata fuori da qualsiasi repository sincronizzato)
e `CICLOVIA_BACKUP_PASSPHRASE` (almeno 18 caratteri, preferibilmente generata da un
password manager). Non inserire valori in comandi salvati nella cronologia, chat,
GitHub o log. Su Windows proteggere la cartella con ACL dell'utente e disco cifrato.

Eseguire `node scripts/backup-adesioni.cjs`. Solo il file `.enc` viene scritto:
AES-256-GCM, sale e nonce casuali, derivazione scrypt. La verifica rilegge il file,
decifra in memoria e confronta tutti i record, non soltanto il conteggio.
Il formato v2 preserva Timestamp (nanosecondi inclusi), bytes e altri tipi Firestore.
Il vecchio formato v1 non viene importato automaticamente: richiede conversione
controllata, perche' la serializzazione JSON precedente perdeva il tipo Timestamp.

Conservare una seconda copia cifrata su supporto separato e la passphrase in un
luogo distinto. Ripetere il backup regolarmente e prima di modifiche al database.
La pianificazione, destinazione, custodia della chiave e durata di conservazione
vanno definite dal titolare prima dell'apertura; questa PR non crea servizi a pagamento.

Verifica senza rete e senza scritture:

```text
node scripts/restore-adesioni.cjs PERCORSO_BACKUP.enc --verify-only
```

## Prova di ripristino

Usare un progetto Firebase isolato, vuoto, con accesso privato e una credenziale
specifica per quel progetto. Impostare `CICLOVIA_RESTORE_PROJECT` e
`CICLOVIA_CONFIRM_RESTORE` allo stesso ID, diverso da `ciclovia-per-la-vita`;
`FIREBASE_SERVICE_ACCOUNT_FILE` deve appartenere alla destinazione.

```text
node scripts/restore-adesioni.cjs PERCORSO_BACKUP.enc --restore
```

Lo script rifiuta la produzione e una collezione non vuota. Usa `create`, mai
`set`/overwrite o delete; verifica poi conteggio, UID, campi e tipi riletti.
I lotti contengono al massimo 400 documenti: un errore dopo un lotto puo' lasciare
un ripristino parziale. Conservare quella destinazione per diagnosi e riprovare
su una nuova destinazione vuota; non cancellare dati esistenti per sbloccare lo script.
Non pubblicare output o schermate contenenti adesioni.

Per il collaudo automatico usare `npm run test:rules`: utilizza esclusivamente
emulatori locali `demo-*` e dati sintetici, senza credenziali reali.

## Recupero di un incidente reale

1. Tenere chiusa la creazione di nuove adesioni sul server e il modulo pubblico.
2. Conservare lo stato attuale e scegliere una copia verificata.
3. Ripristinare su destinazione isolata e confrontare tutti i record.
4. Riconciliare revoche/cancellazioni successive al backup: non resuscitare consensi
   revocati. Un vecchio backup da solo non documenta gli eventi successivi.
5. Verificare separatamente la disponibilita' degli account Auth e la corrispondenza
   degli UID. Un documento ripristinato non ricrea un account.
6. Solo dopo approvazione del titolare, predisporre una migrazione selettiva verso
   produzione e verificarla. Lo script di questa PR non permette questo passaggio.

## Apertura e contatore

Le nuove regole richiedono `config/raccolta.enabled == true` oltre a email verificata
e schema valido. Documento assente/falso significa raccolta chiusa; il browser non
puo' modificarlo. Lettura della propria adesione e revoca restano possibili secondo
le regole. Per aprire servono sia questo interruttore amministrativo sia
`launchEnabled = true`, esclusivamente dopo conferma del titolare.

Il workflow contatore legge `main`; il test manuale `test_connection=true` non
pubblica mai il totale e fallisce se manca la credenziale. Il normale aggiornamento
pubblica solo l'aggregato. Le modifiche del workflow sono operative dopo il merge:
verificare il primo run reale e il JSON pubblico. Il conteggio non certifica persone
fisiche uniche: l'idempotenza e' per UID; l'audit segnala email duplicate senza
esportarle. Nessun account o documento esistente viene deduplicato automaticamente.

Riferimenti: https://firebase.google.com/docs/firestore/manage-data/transactions
e https://firebase.google.com/docs/auth/web/manage-users . La richiesta di invio
email accettata non certifica la consegna nella casella Yahoo: serve un test reale
con casella autorizzata, spam, link, rinnovo token e salvataggio verificato sul server.
