# Collaudo riservato delle adesioni — senza aprire la raccolta pubblica

## Sicurezza
- Il sito pubblico continua a dichiarare `launchEnabled = false`; l'interruttore `config/raccolta.enabled` resta **false**.
- Link tecnico di prova: `https://systemtoolbox.github.io/ciclovia-per-la-vita/adesioni.html?collaudo=1`. E' una pagina pubblicamente raggiungibile da chi conosce il link, **non un accesso privato con password**, ma la sola pagina non abilita alcuna scrittura: i permessi sono limitati dalle regole Firestore.
- In Firebase Console (Dati), solo il titolare prepara il documento `config/collaudo` con:
  - `enabled` di tipo **boolean**, inizialmente **false**;
  - `testEmails` di tipo **array**, contenente **string** con i soli indirizzi email dei profili di prova autorizzati (massimo cinque per il collaudo). Non committare né pubblicare questi indirizzi nel repository.
- Dopo aver pubblicato `firestore.rules` aggiornato sul progetto reale e superato un test negativo, il titolare puo' impostare `config/collaudo.enabled=true` per la durata della prova. La regola `create` richiede un account Firebase del proprietario del documento, email verificata, consenso, schema rigoroso e indirizzo presente nell'elenco. Le altre email NON possono registrare adesioni anche con `?collaudo=1`.
- I documenti salvati durante il collaudo sono **veri documenti in Firestore**. Revocarli alla fine e verificare la collezione vuota; mentre la raccolta pubblica e' chiusa, il contatore deve restare `pending`.
- L'elenco email test e' un dato personale amministrativo conservato in Firestore, protetto dalle regole `allow read, write: if false` per il browser. Rimuoverlo a collaudo finito, o lasciarlo con `enabled=false` per riuso interno, secondo la politica di minimizzazione.
- Al termine impostare subito `config/collaudo.enabled=false`, quindi verificare che anche il profilo autorizzato NON possa creare una nuova adesione. Lettura, revoca e cancellazione della propria adesione restano permesse.
- Non cancellare automaticamente gli account Authentication preesistenti. Eliminarne uno soltanto se il proprietario sceglie espressamente la funzione di cancellazione.

## Prove passo per passo, senza credenziali in chat
1. Applica le nuove regole `firestore.rules` confrontandole con quelle attualmente pubblicate, dopo autorizzazione esplicita; conserva rollback.
2. In Firebase Console crea `config/collaudo` con `enabled=false` e `testEmails` (array di email test). Non modificare `config/raccolta`, che deve restare false.
3. Verifica apertura pubblica bloccata (pagina `adesioni.html` senza query) e lettura `config/collaudo` negata ai visitatori.
4. Imposta solo `config/collaudo.enabled=true`.
5. Sul link tecnico con `?collaudo=1`, entra con uno dei profili autorizzati e email verificata. Conferma un'adesione di prova: deve apparire **Adesione verificata nel database** solo dopo scrittura e rilettura server.
6. Controlla nella Console Firestore la presenza di esattamente un documento `adesioni/{uid}`. Ripeti l'invio: non deve creare doppioni. Controlla anche tentativo da account NON autorizzato (deve essere respinto).
7. Revoca dal proprio profilo, ricarica Firestore e verifica che il documento sia scomparso. Ripeti con gli altri profili, se utile, e verifica il comportamento da mobile.
8. Reimposta `config/collaudo.enabled=false`; prova un altro inserimento che DEVE fallire; verifica Firestore senza documenti di prova.
9. Solo con prove concluse, separatamente autorizza l'apertura vera: `config/raccolta.enabled=true` e `launchEnabled=true`. Aggiorna il conteggio pubblico e verifica i backup dopo la prima adesione legittima.

**Importante:** l'email verificata non identifica una persona reale; cinque caselle di una stessa persona non sono cinque sostenitori distinti. Il conteggio pubblico, se aperto, conta documenti di adesione, non cittadini unici o firme autenticate. I documenti di test devono essere revocati prima dell'apertura.
