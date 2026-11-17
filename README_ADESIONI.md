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
7. Pubblicare sul branch principale, dopo aver finalizzato e approvato l'informativa GDPR, i ruoli del fornitore, il periodo di conservazione e il metodo di cancellazione dei dati e account.
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
