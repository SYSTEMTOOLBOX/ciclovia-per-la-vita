// Visualizza esclusivamente conteggi aggregati pubblici, mai nominativi.
// I dati sono pubblicati da un processo amministrativo autorizzato.
// Se non esiste un conteggio verificato, NON visualizza uno zero inventato.
(async function () {
  const counters = document.querySelectorAll("[data-adesioni-count]");
  const dates = document.querySelectorAll("[data-adesioni-updated]");
  if (!counters.length) return;
  function fallback() {
    counters.forEach(el => el.textContent = "Non disponibile");
    dates.forEach(el => el.textContent = "Raccolta non ancora aperta");
  }
  try {
    const res = await fetch("https://raw.githubusercontent.com/SYSTEMTOOLBOX/ciclovia-per-la-vita/main/adesioni-count.json", {cache: "no-store"});
    if (!res.ok) throw new Error("Conteggio non raggiungibile");
    const data = await res.json();
    if (data.status !== "verified" || !Number.isSafeInteger(data.count) || data.count < 0 ||
        typeof data.updatedAt !== "string" || !Number.isFinite(Date.parse(data.updatedAt))) {
      fallback();
      return;
    }
    const countLabel = new Intl.NumberFormat("it-IT").format(data.count);
    const updated = new Intl.DateTimeFormat("it-IT", {dateStyle:"short",timeStyle:"short",timeZone:"Europe/Rome"}).format(new Date(data.updatedAt));
    counters.forEach(el => el.textContent = countLabel);
    dates.forEach(el => el.textContent = "Aggiornato: " + updated);
  } catch (_) {
    fallback();
  }
})();
