'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

for (const [page, expected] of [
  ['prova-email.html', 'https://systemtoolbox.github.io/ciclovia-per-la-vita/prova-email.html'],
  ['adesioni.html', 'https://systemtoolbox.github.io/ciclovia-per-la-vita/adesioni.html']
]) {
  test(page + ' conserva un ritorno al sito in entrambe le richieste email', () => {
    const html = fs.readFileSync(page, 'utf8');
    assert.match(html, /const verificationReturn\s*=\s*\{/);
    assert.ok(html.includes('url: "' + expected + '"'));
    assert.match(html, /handleCodeInApp:\s*false/);
    assert.match(html, /sendEmailVerification\(user, verificationReturn\)/);
    assert.match(html, /sendVerification\(user\)/);
    assert.match(html, /sendVerification\(auth\.currentUser\)/);
    assert.match(html, /auth\/unauthorized-continue-uri/);
    assert.match(html, /await sendEmailVerification\(user\);/); // fallback sicuro
  });
}
