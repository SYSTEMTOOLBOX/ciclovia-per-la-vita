# Una ciclovia per la vita — rilascio controllato (22/11/2026)

**NON autorizza l'apertura pubblica.** Questa e' la checklist tecnica unica per riprendere senza Codex. Il repository GitHub non applica le regole al progetto Firebase: si tratta di due ambienti separati.

## PASS — riscontri effettivi
- **22/11/2026: screenshot Firebase Console:** Firestore `(default)` in `europe-west1`; nella scheda Dati, documento amministrativo `config/raccolta` creato con **`enabled: false` (boolean)**. Non costituisce una nuova adesione e non apre il server.
- **22/11/2026: screenshot Firebase Console:** dopo l'incolla nella scheda Regole non appare piu' il banner modifiche non pubblicate. Questo indica che la pubblicazione sembra completata, ma la regola finale va ancora verificata con test controllati, non desunta soltanto dall'interfaccia.
- PR #3: sito, adesioni, verifica email, regole, backup cifrato e test su GitHub. Ramo `audit/adesioni-affidabili-20261122`; non ancora unita a `main`.
- GitHub Actions dopo correzione della revoca: workflow [45050117553](https://github.com/SYSTEMTOOLBOX/ciclovia-per-la-vita/actions/runs/45050117553) verde: test Windows, controlli JS, Firebase Auth e Firestore emulator, ripristino sintetico.
- Backup **reale** delle adesioni Firestore creato e riletto con verifica riuscita dall'utente su Windows il 22/11: **0 adesioni**. Non include gli account Authentication; non dimostra un ripristino del file reale.
- Test manuale connessione del contatore GitHub-Firebase riuscito (run #11); nessun conteggio pubblico pubblicato perche' la raccolta e' ancora chiusa.
- Nel codice della PR, nuove adesioni bloccate lato server quando `config/raccolta.enabled` e' assente o non `true`; `launchEnabled=false` per il pubblico.

## DA FARE — non indicare PASS senza prova
1. **Confronto regole Firebase reali**: recuperare, salvare per rollback e confrontare l'intero testo delle regole ATTUALMENTE PUBBLICATE con `firestore.rules` della PR. Le attuali regole potrebbero contenere altro oltre a quanto nel ramo main. Non premere Pubblica prima del confronto. In produzione non applicare regole non autorizzate.
2. **Pubblicazione delle regole**: dopo autorizzazione esplicita del titolare, pubblicare la versione verificata mantenendo `config/raccolta.enabled` assente/falso; controllare che lettura/revoca proprietario e blocco nuove adesioni funzionino. Le regole nella PR non si distribuiscono da sole.
3. **Audit autorizzato** dei soli aggregati Auth / Firestore: 2 account Auth non equivalgono a 2 adesioni; Firestore aveva zero adesioni all'ultimo backup. Non mostrare nominativi.
4. **Ripristino del backup reale**: verificare su progetto di prova isolato, *mai* ripristinare in produzione o sopra un database non vuoto. Decidere anche la strategia separata per gli account Firebase Authentication.
5. **Prova produzione controllata**: solo con consenso, testare con account di proprieta' e server temporaneamente abilitato, senza aprire pubblicamente la UI, poi riportare il server a chiuso. Verificare registrazione, email confermata, documento `adesioni/{uid}`, consenso, lettura, revoca e cancellazione Auth. Non lasciare documenti di test. Gli SDK admin non dimostrano da soli la sicurezza delle regole.
6. **Email Yahoo**: test reale solo con la partecipazione volontaria del titolare della casella. Non chiedere password o codici. Se non arriva, verificare spam, quota, antispam/limiti Auth e reinvio. L'emulatore non misura la consegna delle email reali.
7. **Privacy / conservazione**: confermare ubicazione Firestore, accordi e trasferimenti con i fornitori, tempi e procedura operativa per rimuovere account in scadenza (90 giorni) e documenti (fino a 12 mesi dopo la chiusura); prevedere gestione revoche nei backup. Il codice non certifica la conformita' GDPR.
8. **Dopo le prove, rilascio tecnico**: unire PR #3 mantenendo `launchEnabled=false`, controllare il sito live da telefono e PC e che il contatore sia ancora `pending`. Non modificare account preesistenti.
9. **Autorizzazione finale dell'utente, separata**: aprire coordinando in modo controllato `config/raccolta.enabled=true` (server) e `launchEnabled=true` (sito); monitorare salvataggio reale, GitHub Actions del conteggio aggregato, due copie cifrate e cancellazioni. Non pubblicare cifre inventate.

## ROLLBACK E CONTATTI
- Conservare le regole Firebase precedenti prima della modifica. Ripristinarle solo dopo aver valutato che non riaprano permessi insicuri.
- Per chiudere immediatamente **nuove adesioni**, impostare in Firebase Console `config/raccolta.enabled=false`; disattivare anche `launchEnabled` sulla pagina pubblica. Un'eventuale pagina pubblica vecchia non deve bypassare il server.
- Mantenere attiva la possibilita' di cancellare e revocare le adesioni gia' registrate. Non cancellare o alterare `adesioni` o gli utenti Auth senza richiesta legittima.
- Le adesioni sono espressioni civiche digitali, non firme autenticate e non prova di cittadini unici.

## Limiti che non vanno confusi
- Test automatici/emulatori: **PASS**. Backend produzione e consegna Yahoo: **NON PROVATI**.
- Backup cifrato creato e verificato: **PASS**. Ripristino del file reale: **NON PROVATO**.
- Contatore: **connessione reale PASS**. Primo aggiornamento pubblico con veri dati: **NON PROVATO**.
- Rilascio GitHub: **PR in bozza**, sito pubblico delle adesioni **CHIUSO**.
