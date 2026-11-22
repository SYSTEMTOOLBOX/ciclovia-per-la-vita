# Backup guidato Windows

Avvia con un doppio clic **AVVIA_BACKUP_CICLOVIA.cmd**, nella cartella completa
del ramo della PR #3, accanto a `scripts` e `package-lock.json`. E' l'unico
programma da avviare; riusa gli script del progetto, quindi non spostare il solo
file CMD fuori dalla cartella. Non servono comandi manuali ne' diritti amministratore.

1. Serve Node.js 22 o successivo, installato con npm dal sito ufficiale
   https://nodejs.org . Se manca, il programma lo segnala. Al primo avvio prepara
   le dipendenze con il lockfile, prima di chiedere credenziali o password.
2. Seleziona il JSON **service account** Firebase gia' presente sul PC. Non basta
   il file di configurazione dell'app web. Il programma controlla che appartenga
   a `ciclovia-per-la-vita` prima di qualsiasi accesso Firebase.
3. Scegli la cartella `Backup_Ciclovia`, oppure la cartella privata in cui crearla.
   Selezionando una cartella con nome diverso viene creata al suo interno
   `Backup_Ciclovia`. Usa un disco privato, fuori da repository Git, cartelle
   condivise e sincronizzazioni pubbliche. I checkout Git vengono rifiutati
   anche attraverso junction; non e' possibile riconoscere ogni software cloud.
4. Inserisci e ripeti una password di almeno 18 caratteri: entrambi i campi sono
   mascherati. Conservala separatamente, preferibilmente in un password manager.
5. Attendi l'esito. Il programma legge soltanto `adesioni`, scrive il file cifrato
   `.enc`, lo rilegge e lo verifica tramite gli script esistenti. Mostra solo
   esito e numero di adesioni. Zero e' un risultato valido se Firestore e' vuoto.

La password non viene salvata in file, cronologia o argomenti di processo.
Viene trasmessa attraverso stdin e usata in memoria dal processo Node. I percorsi
e le risposte grezze SDK non vengono mostrati nel risultato. Il JSON resta dov'e'.
Il programma non esegue upload, Git, deploy, ripristini, modifiche o cancellazioni
di dati Firebase e non cambia `launchEnabled`.

Un errore o un'attesa superiore a cinque minuti non produce una conferma.
Un eventuale file `.enc` gia' creato viene conservato: non considerarlo verificato
finche' non viene controllato con `restore-adesioni.cjs --verify-only` come descritto
in [RIPRISTINO_ADESIONI.md](RIPRISTINO_ADESIONI.md). Il backup riguarda Firestore,
non le password e gli account Authentication.

## Prove effettuate e limiti

Test automatizzati eseguiti su Windows con Windows PowerShell 5.1: sintassi e
bootstrap CMD reale (anche da percorso con spazi e simboli); avvio Node e SDK; trasmissione stdin di caratteri
Unicode, virgolette e simboli; controlli dei due campi mascherati; flusso simulato
di successo, annullamento e rifiuto di un progetto errato.
Test Node: riuso dello script reale di backup con lettura Firestore simulata,
creazione di un vero file cifrato su disco, rilettura con lo script di verifica,
rifiuto di cartelle Git/emulatori/progetti errati, mancata conferma su errori,
nessun dettaglio sensibile nei risultati CLI.

**Non ancora provati:** doppio clic e interazione manuale con tutte le finestre
sul desktop dell'utente; installazione delle dipendenze su un PC pulito;
JSON reale, permessi IAM, connettivita' al progetto reale e backup delle adesioni
reali. Nessun JSON privato e' stato cercato o utilizzato durante il collaudo.
Il primo backup reale deve quindi terminare esplicitamente con l'esito verificato.
