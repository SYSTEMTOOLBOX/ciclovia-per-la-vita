# Adesioni online — Una ciclovia per la vita

**Stato: codice predisposto, NON attivo in produzione finché Firebase non è configurato.**

L'attuale sito pubblico è pubblicato da **GitHub Pages** e resta disponibile
anche con il PC di casa spento. La raccolta di dati personali necessita
comunque di un servizio backend: **GitHub Pages è un hosting statico**.

## Soluzione pronta da collegare
- Pagina `adesioni.html` mobile-friendly ospitata su GitHub Pages
- Firebase Authentication: registrazione email+password, link di verifica email, accesso e logout
- Cloud Firestore: un'adesione privata per account verificato; RLS equivalente tramite `firestore.rules`
- Revoca dell'adesione dal proprio profilo
- Dati non visibili agli altri cittadini e non committati sul repository GitHub
- Nessun contatore pubblico che esponga dati o richieda un database leggibile da tutti
- Il modulo resta **inaccessibile alla raccolta** se non configurato

## Attivazione una tantum (senza PC di casa acceso dopo l'attivazione)
1. Creare un progetto Firebase **separato** per la ciclovia nel piano Spark (senza billing), non riutilizzare altri progetti.
2. Firebase console > Build > Authentication > Sign-in method: attivare `Email/Password`.
3. Authentication > Settings > Authorized domains: inserire `systemtoolbox.github.io` (o dominio personalizzato del sito, se usato).
4. Firebase console > Build > Firestore Database: creare il database in regione UE appropriata, modalità di produzione. Non attivare regole pubbliche.
5. Firestore > Rules: **incollare integralmente** `firestore.rules` e pubblicare. Verificare le regole con l'emulatore prima di raccogliere dati reali.
6. Project settings > Your apps > Web app: ottenere i valori web e inserirli in `firebase-config.js`. Questi campi pubblici NON sono password. Non inserire nel repository credenziali admin, service account o chiavi segrete.
7. Prima di aprire la raccolta, finalizzare e approvare l'informativa GDPR, i ruoli del fornitore, il periodo di conservazione e il metodo di cancellazione dei dati e degli account. **Solo dopo i test** impostare `launchEnabled = true` in `firebase-config.js` e pubblicare sul branch principale.
8. Verificare da **due browser/account**: registrazione, email di verifica, registrazione vera, blocco account non verificato, assenza di accesso ai dati altrui, revoca e accesso successivo.
9. Eseguire controlli anti-abuso e predisporre risposte GDPR: le regole non impediscono a una stessa persona di usare due email diverse e non attestano l'identità.

## Protezione e limiti
Il contatore pubblico NON è implementato: sarebbe scorretto rendere leggibile
l'intera collezione per consentire il conteggio. L'esportazione amministrativa
richiede una procedura autorizzata dalla console Firebase o un successivo
strumento server-side ad accesso esclusivo del titolare.

Email verificata significa **controllo della casella, non identificazione
legale della persona**. Le adesioni sono sostegno civico e non firme valide
automaticamente per il deposito formale della petizione in Regione Piemonte.

L'account Firebase rimane dopo la revoca dell'adesione finché l'utente non
richiede la cancellazione o non completa la procedura di eliminazione account.
Le procedure di cancellazione e conservazione devono essere gestite dal
titolare con un processo documentato e coerente con l'informativa.

Firebase Spark prevede limiti di invio email, accessi e database: non è un
servizio illimitato e **0 €/mese** vale solo nei limiti della quota e se
non viene attivata la fatturazione. La disponibilità pubblica dipende dai
servizi GitHub e Firebase, non dal computer domestico.

## Conclusione
Il codice può essere pubblicato ora, ma **non attribuire adesioni reali al
sistema né promuovere il modulo come attivo** prima dei nove passaggi.

## Privacy — revisione 19 novembre 2026
L'informativa in privacy.html identifica il titolare (Loris Nordio) e il
contatto kaironlabsstudio@gmail.com; distingue account e adesione esplicita,
documenta destinatari, conservazione, cancellazione, reclami e trasferimenti.
La versione registrata dall'app e dalle regole Firestore è 2026-11-19-v2.
Il link alla privacy compare anche PRIMA della creazione dell'account.

### Verifiche obbligatorie prima di attivare il servizio
- [ ] Verificare effettiva configurazione di Firebase separato, DPA/termini,
      regione Firestore, trasferimenti internazionali, subfornitori e sicurezza.
- [ ] Stabilire e documentare la data di chiusura della campagna; predisporre
      cancellazione delle adesioni entro 12 mesi dalla chiusura.
- [ ] Predisporre una procedura amministrativa, manuale o automatizzata,
      per cancellare gli account non verificati e inattivi entro 90 giorni.
- [ ] Testare end-to-end: registrazione, email di verifica, consenso,
      versione privacy, blocco accesso a dati altrui, revoca e account delete.
- [ ] Testare il caso di sessione scaduta (Firebase può richiedere nuovo login
      prima di cancellare account).
- [ ] Predisporre processo per email privacy: verifica del richiedente,
      risposte nei termini previsti e cancellazione dei dati collegati.
- [ ] Verificare nessun cookie/servizio inatteso e valutare se il sostegno
      può rivelare opinioni politiche; far revisionare il testo se necessario.
- [ ] Valutare necessità della creazione obbligatoria dell'account e basi
      giuridiche rispetto al servizio effettivo, minimizzazione dei dati.
- [ ] Mantenere launchEnabled=false fino al superamento di tutti i controlli.

Il testo aggiornato NON significa che il database sia pronto o operativo.
Non pubblicizzare il sito come raccolta firme attiva prima dei test.
