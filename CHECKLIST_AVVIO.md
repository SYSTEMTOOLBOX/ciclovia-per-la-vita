# Una ciclovia per la vita — controllo finale prima dell'apertura
Versione 19 novembre 2026. **Questo documento NON attesta l'apertura né la conformità GDPR.**

## Parte pubblica: già predisposta nel repository
- Homepage, proposta e percorso indicativo.
- Pagina dedicata alle adesioni, per ora **disattivata**.
- Informativa privacy, contatto del promotore e consenso esplicito.
- Pagina separata per test email (gli account di prova non generano adesioni).
- Contatore pubblico aggregato che non espone nomi o email: non mostra cifre non verificate.
- Revoca dell'adesione e richiesta di cancellazione account previste nel modulo.
- File `firestore.rules` con accesso solo al proprio documento, negazione delle liste, validazione del contenuto e blocco delle modifiche a un'adesione esistente.

## Blocchi da completare e **verificare realmente**, prima di impostare launchEnabled = true
1. **Firestore:** selezionare/provisionare il database e confermarne la regione; applicare `firestore.rules` in Firebase Console → Firestore Database → Regole, o con Firebase CLI (vedi sotto). La mera presenza su GitHub non applica alcuna regola.
2. **Test negativo dei permessi:** senza account, senza verifica email, e con due account diversi: tentare lettura/elenco/scrittura di altre adesioni e verificare che ogni tentativo venga rifiutato. Verificare inoltre scrittura di campo extra, consenso falso, email diversa e modifica di documento esistente.
3. **Test positivo:** con account maggiorenne e email verificata: creare un'adesione completa; verificare che sia leggibile solo dal proprietario, poi revocarla ed eliminare l'account. I dati di test non devono restare nel totale ufficiale.
4. **Contatore:** configurare in modo riservato su GitHub il secret `FIREBASE_SERVICE_ACCOUNT_JSON` con account di servizio a permessi minimi, mai Owner; verificare almeno una esecuzione completa del workflow `aggiorna-conteggio.yml`, il totale corretto e che nei log appaia soltanto il numero.
5. **Backup:** creare e verificare sul PC privato una copia cifrata con `scripts/backup-adesioni.cjs`, conservarne una seconda copia in un luogo separato e provare il recupero. Il programma attuale conserva le adesioni, non un ripristino completo degli accessi Firebase Authentication.
6. **Cancellazione a scadenza:** implementare il controllo degli account senza adesione o non verificati (90 giorni), il controllo dei documenti alla chiusura della campagna e una procedura concreta per rimuovere o far scadere i backup. Verificare con prova documentata.
7. **Privacy e fornitori:** controllare i termini di trattamento con Google/Firebase e GitHub, i trasferimenti extra SEE, le misure tecniche, il periodo di conservazione e l'adeguatezza della base giuridica, anche per dati potenzialmente rivelatori di opinioni politiche. Opportuno parere professionale prima del lancio.
8. **Accesso amministrativo:** proteggere Firebase e GitHub con autenticazione a più fattori, utenti e ruoli minimi; non pubblicare chiavi private, esportazioni o screenshot di credenziali.
9. **Verifica del sito live:** da telefono e da computer controllare homepage, collegamenti, email, privacy, navigazione, form, messaggi d'errore, contatore e cancellazione. Annotare gli esiti e l'ora.
10. **Apertura:** solo dopo i test, cambiare `launchEnabled = false` in `true`, pubblicare e provare una adesione reale autorizzata. Controllare il contatore e il piano di backup periodico.

## Per applicare le regole
Il repository contiene `firebase.json` e `firestore.rules`. Firebase indica che le regole possono essere applicate nella console Firestore, scheda **Regole**, oppure da un PC già autenticato tramite il comando:

```bash
firebase deploy --only firestore:rules --project ciclovia-per-la-vita
```

Prima della pubblicazione, confrontare attentamente le regole già online con quelle proposte; non sovrascrivere altre regole esistenti se servono applicazioni differenti.

## Distinzione fondamentale
Le **adesioni civiche** del sito non sono firme autenticate per la petizione regionale; il conteggio mostra documenti di adesione registrati, non cittadini unici verificati. Una persona potrebbe creare più email. Una petizione formale richiede la procedura istituzionale separata.

Riferimenti: https://firebase.google.com/docs/firestore/security/get-started ; https://firebase.google.com/docs/rules/manage-deploy ; https://www.garanteprivacy.it/ ; https://eur-lex.europa.eu/legal-content/IT/TXT/?uri=CELEX:32016R0679 .
