# Una ciclovia per la vita — Chivasso–Asti

Sito dell'iniziativa civica indipendente per chiedere uno studio di fattibilità sulla riconversione del sedime ferroviario Chivasso–Asti in una ciclovia.

**Sito pubblico:** https://systemtoolbox.github.io/ciclovia-per-la-vita/

## Pagine
- [Homepage](https://systemtoolbox.github.io/ciclovia-per-la-vita/)
- [Adesioni civiche](https://systemtoolbox.github.io/ciclovia-per-la-vita/adesioni.html)
- [Informativa privacy](https://systemtoolbox.github.io/ciclovia-per-la-vita/privacy.html)
- [Prova tecnica email](https://systemtoolbox.github.io/ciclovia-per-la-vita/prova-email.html) — account di prova, non adesione

## Stato operativo
- La parte informativa e il modulo sono predisposti.
- Il codice imposta `launchEnabled = false`: **le adesioni pubbliche non sono ancora aperte**. Non cambiare il valore finché non sono stati eseguiti i controlli dal progetto Firebase reale.
- Il totale pubblico delle adesioni usa esclusivamente dati aggregati; non pubblica nome e email.
- In Firestore gli account devono vedere solo la propria adesione, secondo `firestore.rules`. **Queste regole devono ancora essere applicate e testate su Firebase**: inserirle nel repository non le distribuisce.
- Script di copia di sicurezza cifrata e aggiornamento conteggio predisposti; la loro esecuzione effettiva richiede configurazione amministrativa e collaudo.

## Documenti e controlli
- [Checklist di avvio](CHECKLIST_AVVIO.md)
- [Guida per contatore e backup](GUIDA_CONTATORE_BACKUP.md)
- [Regole sicurezza Firestore](firestore.rules)

## Verifica automatica
A ogni aggiornamento a `main`, il workflow `verifica-sito.yml` controlla link locali, presenza delle pagine, coerenza delle versioni privacy, consenso e integrità dei segmenti del video iniziale. Avviabile anche da PC con:
```bash
node scripts/verify-site.cjs
```
Il controllo statico non testa l'infrastruttura Firebase o la validità giuridica delle adesioni.

**Nota:** le adesioni espresse sul sito non costituiscono sottoscrizioni autenticate di una petizione ufficiale.
