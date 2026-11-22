'use strict';
const crypto = require('node:crypto');
const MAGIC = Buffer.from('CICLOVIA1');
function encrypt(data, password) {
  if (typeof password !== 'string' || password.length < 18) throw new Error('Passphrase troppo corta.');
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.scryptSync(password, salt, 32);
  try {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const body = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
    return Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), body]);
  } finally { key.fill(0); }
}
function decrypt(binary, password) {
  if (!Buffer.isBuffer(binary) || binary.length < 54 || !binary.subarray(0,9).equals(MAGIC)) throw new Error('Formato backup non valido.');
  const key = crypto.scryptSync(password, binary.subarray(9,25), 32);
  try {
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, binary.subarray(25,37));
    decipher.setAuthTag(binary.subarray(37,53));
    return JSON.parse(Buffer.concat([decipher.update(binary.subarray(53)), decipher.final()]).toString('utf8'));
  } finally { key.fill(0); }
}
// Ogni valore e' tipizzato: nessuna collisione con nomi di campi dell'utente.
function encode(v) {
  if (v === null || ['string','boolean'].includes(typeof v)) return ['value',v];
  if (typeof v === 'number') return ['number',String(v)];
  if (v && typeof v.toDate === 'function' && Number.isInteger(v.nanoseconds)) return ['timestamp',v.seconds,v.nanoseconds];
  if (Buffer.isBuffer(v) || v instanceof Uint8Array) return ['bytes',Buffer.from(v).toString('base64')];
  if (v instanceof Date) return ['timestamp',Math.floor(v.getTime()/1000),(v.getTime()%1000)*1e6];
  if (v && typeof v.latitude === 'number' && typeof v.longitude === 'number') return ['geopoint',v.latitude,v.longitude];
  if (v && typeof v.path === 'string' && v.firestore) return ['reference',v.path];
  if (Array.isArray(v)) return ['array',v.map(encode)];
  if (v && Object.getPrototypeOf(v) === Object.prototype) return ['map',Object.keys(v).sort().map(k=>[k,encode(v[k])])];
  throw new Error('Tipo Firestore non supportato: backup interrotto.');
}
function decode(v, db, types) {
  switch(v[0]) {
    case 'value': return v[1];
    case 'number': return Number(v[1]);
    case 'timestamp': return new types.Timestamp(v[1],v[2]);
    case 'bytes': return Buffer.from(v[1],'base64');
    case 'geopoint': return new types.GeoPoint(v[1],v[2]);
    case 'reference': return db.doc(v[1]);
    case 'array': return v[1].map(x=>decode(x,db,types));
    case 'map': return Object.fromEntries(v[1].map(([k,x])=>[k,decode(x,db,types)]));
    default: throw new Error('Tipo backup sconosciuto.');
  }
}
function validate(data) {
  if (data.format !== 'ciclovia-adesioni-backup-v2' || data.sourceProject !== 'ciclovia-per-la-vita' ||
      !Array.isArray(data.records) || data.count !== data.records.length) throw new Error('Manifest backup non valido.');
  const ids = new Set();
  for (const r of data.records) {
    if (typeof r.uid !== 'string' || !r.uid || r.uid.includes('/') || ids.has(r.uid) || r.fields?.[0] !== 'map') throw new Error('Record backup non valido.');
    ids.add(r.uid);
  }
  return data;
}
module.exports = {encrypt,decrypt,encode,decode,validate};
