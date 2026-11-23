# Ritorno al sito dopo la verifica email

Le pagine `prova-email.html` e `adesioni.html` ora inviano l'email di verifica Firebase con `ActionCodeSettings.url` e `handleCodeInApp: false`. Il gestore predefinito di Firebase verifica l'indirizzo e, quando accetta il parametro `continueUrl`, puo' presentare il pulsante **Continua** che riporta alla pagina corrispondente. Non e' un redirect automatico garantito.

## Prerequisito necessario su Firebase reale

Authentication → Metodo di accesso → **Domini autorizzati** → controllare la presenza di **`systemtoolbox.github.io`**. Se manca, aggiungerlo (senza `https://` e senza il percorso `/ciclovia-per-la-vita`). Nessuna credenziale deve essere condivisa.

Fino alla configurazione, le due pagine gestiscono il solo errore `auth/unauthorized-continue-uri` / `auth/invalid-continue-uri`: richiedono l'email con il meccanismo precedente e informano che l'utente dovra' riaprire il sito manualmente. Gli altri errori non sono mascherati.

## Collaudo da completare prima dell'apertura

1. Lasciare `launchEnabled = false` e `config/raccolta.enabled = false`.
2. Da `prova-email.html`, creare un account nuovo di prova autorizzato e richiedere la verifica.
3. Aprire il link dell'email: confermare l'indirizzo e controllare che esista l'azione **Continua** per tornare alla pagina di prova. Se non appare, ispezionare il dominio autorizzato e il collegamento inviato.
4. Tornare alla pagina e verificare `EMAIL CONFERMATA`. Poi eliminare l'account di prova se non occorre.
5. Verificare separatamente l'effettiva ricezione da Yahoo e Live.it: il ritorno al sito **non corregge** la consegna delle email a quei provider.

Non modificare le regole Firestore, non pubblicare credenziali e non aprire la raccolta per questo collaudo.
