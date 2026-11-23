'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

test('la locandina e nascosta fino ad apertura e disponibilita reale del PDF', () => {
  const html = fs.readFileSync('index.html','utf8');
  const firebase = fs.readFileSync('firebase-config.js','utf8');
  assert.match(html, /<section[^>]*id="diffondi"[^>]*hidden>/);
  assert.match(html, /id="scarica-locandina"[^>]*data-pdf-url="locandina_ciclovia_per_la_vita_A4_aggiornata.pdf"[^>]*hidden>/);
  assert.match(html, /if \(launchEnabled === true\) \{/);
  assert.match(html, /fetch\(posterUrl.href, \{ method: "HEAD", cache: "no-store" \}\)/);
  assert.match(html, /res\.ok/);
  assert.match(html, /application\/pdf/);
  assert.match(html, /posterLink\.href = posterUrl\.href/);
  assert.match(firebase, /export const launchEnabled = false;/);
});
