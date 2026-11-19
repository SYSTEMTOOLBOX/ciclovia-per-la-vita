# Contatore pubblico e copie di sicurezza (19 novembre 2026)

## Stato effettivo, oggi

- La raccolta delle **adesioni civiche** resta disattivata: `firebase-config.js` contiene `launchEnabled = false`.
- Sul sito è predisposto un riquadro pubblico di conteggio aggregato, inizialmente **Non disponibile**. Nessun numero è inventato.
- `adesioni-count.json` contiene solo `status`, `count`, `updatedAt` e descrizione: mai nomi, email o documenti personali.
- La pagina adesioni mostra nome e email solamente nel profilo dell'utente autenticato; non esiste elenco pubblico.
- Gli account della pagina `prova-email.html` sono solo prove di Firebase Authentication e **non** creano documenti nella collezione `adesioni`: non contano.
- Non è ancora stato eseguito un backup effettivo dei dati: è disponibile soltanto il programma di backup cifrato da configurare e collaudare.

## Contatore orario predisposto, non ancora avviato

Il workflow `.github/workflows/aggiorna-conteggio.yml` interroga la collezione riservata `adesioni` usando una query `count()`. Trasferisce al repository pubblico **solo il numero totale e l'orario**, non le singole adesioni. Si esegue al massimo una volta all'ora secondo la pianificazione e i limiti GitHub; non è un contatore in tempo reale. Al momento il workflow **non può funzionare** senza configurazione amministrativa.

### Checklist di sicurezza prima di attivare il conteggio

1. Terminare verifiche privacy, regole Firestore, revoca e cancellazioni a scadenza.
2. Predisporre un service account **separato, di sola lettura Firestore**, senza privilegi di amministrazione di altri servizi. Non utilizzare una chiave Owner.
3. Salvare **personalmente** il JSON del service account in **GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret**, nome `FIREBASE_SERVICE_ACCOUNT_JSON`. Non inserire il segreto nel codice, nei commenti, in chat o nei screenshot.
4. Revisionare il workflow, le autorizzazioni GitHub e i controlli prima di consegnare qualsiasi credenziale. Usare un ambiente di accesso limitato e MFA.
5. SOLO dopo i collaudi, attivare `launchEnabled = true` e aprire la raccolta con un avviso sul sito. Il workflow non pubblica conteggi finché questo interruttore resta disattivato.
6. Verificare nella scheda **Actions** di GitHub che la prima esecuzione sia riuscita e che il file pubblico riporti `status: verified` e una data recente. Se il conteggio non è aggiornato, mostrare un avviso anziché presentarlo come "live".
7. Verificare periodicamente le quote gratuite Firebase e GitHub, la disponibilità dei workflow schedulati e l'assenza di dati personali nei log e nei commit.

GitHub Pages può non ricompilare il sito per un commit del GITHUB_TOKEN; il browser legge dunque la sola cifra dal file aggregato RAW pubblico, non dal database Firestore.

## Backup cifrato gratuito (ANCORA DA ESEGUIRE)

È disponibile `scripts/backup-adesioni.cjs`. Si esegue **solo sul PC del titolare**, mai come action pubblica e mai sulla pagina web.

- Richiede Node.js e pacchetto `firebase-admin`, un JSON di account di servizio conservato **soltanto sul PC privato**, e una passphrase lunga tenuta separata.
- Le variabili di ambiente sono `FIREBASE_SERVICE_ACCOUNT_FILE`, `CICLOVIA_BACKUP_DIR` e `CICLOVIA_BACKUP_PASSPHRASE`.
- Legge la collezione delle adesioni e crea in una cartella **fuori dal repository** un file `.enc` cifrato AES-256-GCM, con chiave derivata dalla passphrase e sale casuale.
- Il programma rilegge il file e verifica decrittazione e numero di documenti, ma **non è ancora un test completo di ripristino**.
- Questa prima copia conserva i **documenti delle adesioni**, non un esportazione completa degli account di Firebase Authentication: serve una procedura separata per ricostruire l'accesso degli utenti dopo un guasto grave.
- Creare **almeno due copie cifrate in due luoghi separati**, ad esempio disco esterno e archivio cloud privato. Non mettere mai l'archivio in un repository GitHub pubblico, neppure cifrato.
- Impostare un piano periodico di backup, provare davvero il recupero e verificare eventuali richieste di cancellazione e limiti GDPR anche nelle copie di sicurezza.
- Se si perdono sia la chiave di accesso al progetto sia la passphrase del backup, non è possibile garantire un ripristino dei dati.

## Limiti da non confondere

Una email verificata prova il controllo della casella, non l'identità anagrafica. Una stessa persona potrebbe possedere più indirizzi e risultare più volte: l'indicatore deve essere chiamato **adesioni civiche confermate**, non "cittadini unici" o "firme autenticate".

Per il Consiglio regionale del Piemonte, una **petizione** può essere presentata anche da un solo cittadino secondo le formalità vigenti; la proposta di **legge di iniziativa popolare** è altra procedura e richiede 8.000 sottoscrizioni regolari.

Norme ufficiali:
- https://www.cr.piemonte.it/cms/il-cittadino/partecipazione/petizioni-e-proposte-di-legge-di-iniziativa-popolare-e-degli-enti-1
- https://www.cr.piemonte.it/cms/il-cittadino/partecipazione/petizioni-e-proposte-di-legge-di-iniziativa-popolare-e-degli-enti-3
