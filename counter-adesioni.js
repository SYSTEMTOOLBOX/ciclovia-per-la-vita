// Visualizza esclusivamente conteggi aggregati pubblici, mai nominativi.
// I dati sono pubblicati da un processo amministrativo autorizzato.
// Se non esiste un conteggio verificato, NON visualizza uno zero inventato.
(async function () {
  const counters = document.querySelectorAll("[data-adesioni-count]");
  const dates = document.querySelectorAll("[data-adesioni-updated]");
  if (!counters.length) return;
  function fallback(closed = false) {
    counters.forEach(el => { el.textContent = "—"; if (el.dataset) el.dataset.counterState = "unavailable"; });
    dates.forEach(el => el.textContent = closed ? "Raccolta non ancora aperta" : "Conteggio temporaneamente non disponibile");
  }
  async function aggiornaContatore() {
  try {
    const res = await fetch("https://raw.githubusercontent.com/SYSTEMTOOLBOX/ciclovia-per-la-vita/main/adesioni-count.json", {cache: "no-store"});
    if (!res.ok) throw new Error("Conteggio non raggiungibile");
    const data = await res.json();
    if (data.status === "pending") { fallback(true); counters.forEach(el => { if (el.dataset) el.dataset.counterState = "pending"; }); return; }
    if (data.status !== "verified" || !Number.isSafeInteger(data.count) || data.count < 0 ||
        typeof data.updatedAt !== "string" || !Number.isFinite(Date.parse(data.updatedAt)) ||
        Date.parse(data.updatedAt) > Date.now() + 300000 || Date.now() - Date.parse(data.updatedAt) > 86400000) {
      fallback();
      return;
    }
    const countLabel = new Intl.NumberFormat("it-IT").format(data.count);
    const updated = new Intl.DateTimeFormat("it-IT", {dateStyle:"short",timeStyle:"short",timeZone:"Europe/Rome"}).format(new Date(data.updatedAt));
    counters.forEach(el => { el.textContent = countLabel; if (el.dataset) el.dataset.counterState = "verified"; });
    dates.forEach(el => el.textContent = "Aggiornato: " + updated);
  } catch (_) {
    fallback();
  }
  }
  // Il totale viene ricaricato quando si ritorna sulla pagina e mentre è visibile.
  // La fonte pubblica è aggregata e aggiornata periodicamente, non in tempo reale.
  await aggiornaContatore();
  if (typeof document.addEventListener === "function") {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) void aggiornaContatore();
    });
  }
  if (typeof setInterval === "function") {
    setInterval(() => {
      if (!document.hidden) void aggiornaContatore();
    }, 120000);
  }
})();
