// Spiellogik ohne Oberfläche (läuft auch in Node-Tests)
import { PLANTS, PLANT_IDS, RARITIES, HIDDEN, RARITY_WEIGHT, RARITY_STOCK, RUF, MUT, BUILDINGS, START, LAGER_BASIS, LAGER_STUFEN, MIN, STUNDE, feldPreis } from './data.js';

export const SEASON_MS = 3 * STUNDE;   // 4 Jahreszeiten = 12 echte Stunden
export const WETTER_MS = 20 * MIN;
export const SAVE_KEY = 'erntezeitaufbruch_v1';
export const MAX_OFFLINE = 7 * 24 * STUNDE;

// ── Zufall ──────────────────────────────────────────────
export function hash32(n) { n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); n = Math.imul(n ^ (n >>> 16), 0x45d9f3b); return (n ^ (n >>> 16)) >>> 0; }
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ── Welt: Jahreszeit und Wetter hängen nur von der echten Uhrzeit ab ──
export function seasonAt(t) { return Math.floor(t / SEASON_MS) % 4; }
export function seasonProgress(t) { return (t % SEASON_MS) / SEASON_MS; }
export function weatherAt(t) {
  const block = Math.floor(t / WETTER_MS), s = seasonAt(t);
  const r = (hash32(block * 7919 + 13) % 1000) / 1000;
  if (s === 3) return r < 0.40 ? 'schnee' : r < 0.60 ? 'nebel' : r < 0.85 ? 'wolken' : 'sonne';
  if (s === 1) return r < 0.12 ? 'regen' : r < 0.18 ? 'gewitter' : r < 0.30 ? 'wolken' : 'sonne';
  if (s === 2) return r < 0.28 ? 'regen' : r < 0.34 ? 'gewitter' : r < 0.52 ? 'nebel' : r < 0.72 ? 'wolken' : 'sonne';
  return r < 0.25 ? 'regen' : r < 0.30 ? 'gewitter' : r < 0.50 ? 'wolken' : 'sonne';
}
export const WETTER_NAME = { sonne: 'Sonnig', wolken: 'Bewölkt', regen: 'Regen', gewitter: 'Gewitter', nebel: 'Nebel', schnee: 'Schnee' };

// ── Spielstand ──────────────────────────────────────────
export function neuerStand(now = Date.now()) {
  return {
    v: 1, erstellt: now, lastTick: now, name: '',
    geld: START.geld, ruf: 0,
    felder: START.felderStart,
    tiles: Array(START.felderMax).fill(null),
    boden: Array(START.felderMax).fill(100),       // Fruchtbarkeit 0–100
    wasser: Array(START.felderMax).fill(0),        // 0–1
    letzte: Array(START.felderMax).fill(null),     // letzte Familie je Feld
    gebaeude: { brunnen: 0, gewaechshaus: 0, scheune: 0, marktstand: 0, kompost: 0 },
    lager: [],            // Ernte: { id, muts:[], n }
    samen: [],            // Samentasche: { id, muts:[], n }
    gekauft: { stunde: 0, n: {} },
    nachfrage: {},        // id -> { n, t }
    entdeckt: {},         // id -> { p, g, best }
    letztesWetter: null,
    stat: { geerntet: 0, verkauft: 0, verdient: 0 },
    einst: { ton: true },
  };
}
export function migriere(s) {
  const n = neuerStand(s.lastTick || Date.now());
  const o = Object.assign(n, s);
  o.gebaeude = Object.assign(n.gebaeude, s.gebaeude || {});
  o.stat = Object.assign(n.stat, s.stat || {});
  o.einst = Object.assign(n.einst, s.einst || {});
  for (const k of ['tiles', 'boden', 'wasser', 'letzte']) while (o[k].length < START.felderMax) o[k].push(k === 'boden' ? 100 : k === 'wasser' ? 0 : null);
  return o;
}

// ── Hilfen ──────────────────────────────────────────────
export function rufStufe(st) { let r = RUF[0]; for (const s of RUF) if (st.ruf >= s.ab) r = s; return r; }
export function naechsteRuf(st) { return RUF.find(s => s.ab > st.ruf) || null; }
export function freigeschaltet(st) { const bis = RARITIES.indexOf(rufStufe(st).bis); return RARITIES.filter((_, i) => i <= bis); }
export function addRuf(st, n) { st.ruf += n; }
export function lagerMax(st) { return LAGER_STUFEN[st.gebaeude.scheune] || LAGER_BASIS; }
export function lagerAnzahl(st) { return st.lager.reduce((a, i) => a + i.n, 0); }
export function glasFelder(st) { return st.gebaeude.gewaechshaus * 5; }
export function marktKarten(st) { return 4 + st.gebaeude.marktstand; }
export function wasserDauer(st) { return 6 * MIN * [1, 1.5, 2, 3][st.gebaeude.brunnen]; }
export function kompostRueck(st) { return [0, 0.4, 0.5, 0.6][st.gebaeude.kompost]; }
export function erdeRate(st) { return [1, 2, 3, 4][st.gebaeude.kompost]; }   // Prozentpunkte Erholung pro Minute (leere Felder)
export function mutMult(muts) { return 1 + (muts || []).reduce((a, m) => a + (MUT[m] ? MUT[m].plus : 0), 0); }
export function itemKey(id, muts) { return id + '|' + (muts || []).slice().sort().join(','); }

export function nachfrageFaktor(st, id, now) {
  const e = st.nachfrage[id]; if (!e) return 1;
  const n = Math.max(0, e.n - (now - e.t) / (2 * MIN));
  return Math.max(0.5, 1 - 0.03 * n);
}
export function preisFuer(st, id, muts, now) {
  return PLANTS[id].wert * mutMult(muts) * nachfrageFaktor(st, id, now);
}

// Wachstumstempo eines Feldes zum Zeitpunkt t
export function tempo(st, idx, t) {
  const tile = st.tiles[idx]; if (!tile) return 0;
  const p = PLANTS[tile.id];
  const s = seasonAt(t), w = weatherAt(t);
  const geschuetzt = idx < glasFelder(st);
  let f = 1;
  if (p.saison !== 'a') {
    const ps = 'fshw'.indexOf(p.saison);
    if (geschuetzt) f *= 1.0;
    else if (ps === s) f *= 1.3;
    else if ((ps + 2) % 4 === s) f *= 0.7;
    else if (s === 3) f *= 0.85;
  }
  f *= st.wasser[idx] > 0 ? 1 : 0.5;
  f *= 0.6 + 0.4 * (st.boden[idx] / 100);
  if (w === 'regen') f *= 1.1; else if (w === 'sonne') f *= 1.05;
  return f;
}
export function restZeit(st, idx, t) {
  const tile = st.tiles[idx]; if (!tile || tile.prog >= tile.total) return 0;
  return (tile.total - tile.prog) / Math.max(0.05, tempo(st, idx, t));
}
export function istReif(tile) { return !!tile && tile.prog >= tile.total; }

// ── Zeit weiterlaufen lassen (auch Offline) ─────────────
export function tick(st, now, rnd = Math.random) {
  let t = st.lastTick;
  if (now < t) { st.lastTick = now; return; }
  if (now - t > MAX_OFFLINE) t = now - MAX_OFFLINE;
  const SCHRITT = 60000;
  const ereignisse = [];
  while (t < now) {
    const dt = Math.min(SCHRITT, now - t), mid = t + dt / 2;
    const w = weatherAt(mid), s = seasonAt(mid);
    const regen = w === 'regen' || w === 'gewitter' || w === 'schnee';
    const wasserDt = dt / wasserDauer(st);
    const brunnenAuto = st.gebaeude.brunnen >= 3;
    const min = dt / MIN;
    for (let i = 0; i < st.felder; i++) {
      // Wasser
      if (regen || brunnenAuto) st.wasser[i] = 1; else st.wasser[i] = Math.max(0, st.wasser[i] - wasserDt * (s === 1 && w === 'sonne' ? 1.4 : 1));
      const tile = st.tiles[i];
      if (!tile) {
        st.boden[i] = Math.min(100, st.boden[i] + erdeRate(st) * min);
        continue;
      }
      if (tile.prog < tile.total) {
        tile.prog = Math.min(tile.total, tile.prog + dt * tempo(st, i, mid));
        const geschuetzt = i < glasFelder(st);
        // Wetter-Mutationen während des Wachsens
        const add = (m, chance) => { if (!tile.muts.includes(m) && rnd() < chance * min) { tile.muts.push(m); ereignisse.push({ typ: 'mut', idx: i, m }); } };
        if (w === 'gewitter' && !geschuetzt) add('geladen', 0.04);
        if (w === 'regen') add('nass', 0.03);
        if (s === 3 && !geschuetzt && PLANTS[tile.id].saison !== 'w') add('frostig', 0.015);
        if (s === 2 && !geschuetzt) add('reif', 0.01);
        if (w === 'sonne' && st.letztesWetter === 'regen') add('regenbogen', 0.06 / Math.max(1, min));
      }
    }
    st.letztesWetter = w;
    t += dt;
  }
  st.lastTick = now;
  return ereignisse;
}

// ── Aktionen ────────────────────────────────────────────
function eintrag(arr, id, muts, n) {
  const k = itemKey(id, muts);
  const e = arr.find(x => itemKey(x.id, x.muts) === k);
  if (e) e.n += n; else arr.push({ id, muts: (muts || []).slice(), n });
}
export function seedAnzahl(st, key) { const e = st.samen.find(x => itemKey(x.id, x.muts) === key); return e ? e.n : 0; }

export function pflanzen(st, idx, key, now, rnd = Math.random) {
  if (idx < 0 || idx >= st.felder) return { ok: false, grund: 'Das Feld gehört dir noch nicht.' };
  if (st.tiles[idx]) return { ok: false, grund: 'Hier wächst schon etwas.' };
  const e = st.samen.find(x => itemKey(x.id, x.muts) === key);
  if (!e || e.n <= 0) return { ok: false, grund: 'Keine Samen mehr.' };
  const p = PLANTS[e.id];
  e.n--; if (e.n <= 0) st.samen.splice(st.samen.indexOf(e), 1);
  const muts = (e.muts || []).slice();
  if (!muts.includes('gold') && rnd() < 0.05) muts.push('gold');
  if (!muts.includes('regenbogen') && rnd() < 0.01) muts.push('regenbogen');
  const riesig = muts.includes('riesig');
  const mono = st.letzte[idx] === p.arche;
  st.boden[idx] = Math.max(0, st.boden[idx] - 8 - (mono ? 8 : 0));
  const t = now, regenJetzt = ['regen', 'gewitter', 'schnee'].includes(weatherAt(t));
  st.wasser[idx] = regenJetzt ? 1 : Math.max(st.wasser[idx], 0.6);
  st.tiles[idx] = { id: e.id, prog: 0, total: p.min * MIN * (riesig ? 1.4 : 1), muts, ernten: 0, ff: !!st.letzte[idx] && !mono, mono };
  const d = st.entdeckt[e.id] || (st.entdeckt[e.id] = { p: 0, g: 0, best: 0 });
  const neu = d.p === 0 && d.g === 0; d.p++;
  addRuf(st, 1);
  return { ok: true, neu, mono };
}

export function giessen(st, idx) {
  if (idx < 0 || idx >= st.felder) return false;
  st.wasser[idx] = 1; return true;
}
export function alleGiessen(st) {
  let n = 0;
  for (let i = 0; i < st.felder; i++) if (st.tiles[i] && st.wasser[i] < 0.5) { st.wasser[i] = 1; n++; }
  return n;
}

export function maxErnten() { return 4; }
export function ernten(st, idx, rnd = Math.random) {
  const tile = st.tiles[idx];
  if (!istReif(tile)) return { ok: false, grund: 'Noch nicht reif.' };
  const p = PLANTS[tile.id];
  let menge = p.typ === 's' ? 1 : 2 + Math.floor(rnd() * 3);
  if (tile.ff && rnd() < 0.5) menge += 1;                 // Fruchtfolge-Bonus
  const frei = lagerMax(st) - lagerAnzahl(st);
  if (frei <= 0) return { ok: false, grund: 'Das Lager ist voll. Verkaufe etwas oder baue die Scheune aus.' };
  menge = Math.min(menge, frei);
  eintrag(st.lager, tile.id, tile.muts, menge);
  const d = st.entdeckt[tile.id] || (st.entdeckt[tile.id] = { p: 0, g: 0, best: 0 });
  d.g += menge; d.best = Math.max(d.best, mutMult(tile.muts));
  st.stat.geerntet += menge;
  const res = { ok: true, id: tile.id, menge, muts: tile.muts.slice() };
  if (p.typ === 's') { st.letzte[idx] = p.arche; st.tiles[idx] = null; }
  else {
    tile.ernten++;
    if (tile.ernten >= maxErnten()) { st.letzte[idx] = p.arche; st.tiles[idx] = null; res.verwelkt = true; }
    else { tile.prog = 0; tile.total = p.min * MIN * 0.5; tile.ff = false; }
  }
  return res;
}
export function alleErnten(st, rnd = Math.random) {
  const out = []; let voll = false;
  for (let i = 0; i < st.felder; i++) if (istReif(st.tiles[i])) { const r = ernten(st, i, rnd); if (r.ok) out.push(r); else if (r.grund.startsWith('Das Lager')) { voll = true; break; } }
  return { ernten: out, voll };
}

export function roden(st, idx) {
  const tile = st.tiles[idx]; if (!tile) return { ok: false };
  const p = PLANTS[tile.id];
  const rueck = Math.floor(p.preis * kompostRueck(st));
  st.geld += rueck; st.letzte[idx] = p.arche; st.tiles[idx] = null;
  return { ok: true, rueck };
}

export function verkaufen(st, key, n, now) {
  const e = st.lager.find(x => itemKey(x.id, x.muts) === key); if (!e) return 0;
  n = Math.min(n, e.n); if (n <= 0) return 0;
  const einzel = preisFuer(st, e.id, e.muts, now);
  // jede verkaufte Pflanze drückt den Preis ein wenig: Summe mit sinkendem Faktor
  let summe = 0;
  for (let i = 0; i < n; i++) {
    const f = nachfrageFaktor(st, e.id, now);
    summe += PLANTS[e.id].wert * mutMult(e.muts) * f;
    const nf = st.nachfrage[e.id] || (st.nachfrage[e.id] = { n: 0, t: now });
    nf.n = Math.max(0, nf.n - (now - nf.t) / (2 * MIN)) + 1; nf.t = now;
  }
  summe = Math.round(summe);
  e.n -= n; if (e.n <= 0) st.lager.splice(st.lager.indexOf(e), 1);
  st.geld += summe; st.stat.verkauft += n; st.stat.verdient += summe;
  return summe;
}
export function alleVerkaufen(st, now) {
  let summe = 0, n = 0;
  for (const e of st.lager.slice()) { n += e.n; summe += verkaufen(st, itemKey(e.id, e.muts), e.n, now); }
  return { summe, n };
}

// ── Samen-Markt (für alle Spieler gleich, wechselt zur vollen Stunde) ──
export function marktSortiment(st, now) {
  const stunde = Math.floor(now / STUNDE);
  const r = rng(stunde * 2654435761 + 99);
  const frei = freigeschaltet(st);
  const pool = PLANT_IDS.filter(id => frei.includes(PLANTS[id].rar) && !HIDDEN.includes(PLANTS[id].rar));
  const karten = marktKarten(st), ids = [];
  const gewichte = pool.map(id => RARITY_WEIGHT[PLANTS[id].rar] || 1);
  while (ids.length < Math.min(karten, pool.length)) {
    let sum = 0; pool.forEach((id, i) => { if (!ids.includes(id)) sum += gewichte[i]; });
    let x = r() * sum;
    for (let i = 0; i < pool.length; i++) { if (ids.includes(pool[i])) continue; x -= gewichte[i]; if (x <= 0) { ids.push(pool[i]); break; } }
  }
  if (st.gekauft.stunde !== stunde) { st.gekauft.stunde = stunde; st.gekauft.n = {}; }
  return ids.map(id => {
    const [a, b] = RARITY_STOCK[PLANTS[id].rar];
    const vorrat = a + Math.floor(r() * (b - a + 1));
    return { id, vorrat, uebrig: vorrat - (st.gekauft.n[id] || 0) };
  });
}
export function naechsterMarkt(now) { return (Math.floor(now / STUNDE) + 1) * STUNDE - now; }
export function samenKaufen(st, id, n, now) {
  if (id === 'karotte-grund') { const p = PLANTS.karotte; const preis = p.preis * n; if (st.geld < preis) return { ok: false, grund: 'Zu wenig Geld.' }; st.geld -= preis; eintrag(st.samen, 'karotte', [], n); return { ok: true, preis }; }
  const sort = marktSortiment(st, now).find(x => x.id === id);
  if (!sort || sort.uebrig < n) return { ok: false, grund: 'Nicht mehr genug da.' };
  const preis = PLANTS[id].preis * n;
  if (st.geld < preis) return { ok: false, grund: 'Zu wenig Geld.' };
  st.geld -= preis; st.gekauft.n[id] = (st.gekauft.n[id] || 0) + n; eintrag(st.samen, id, [], n);
  return { ok: true, preis };
}

// ── Ausbau ──────────────────────────────────────────────
export function feldKaufen(st) {
  if (st.felder >= START.felderMax) return { ok: false, grund: 'Mehr Land gibt es nicht.' };
  const p = feldPreis(st.felder);
  if (st.geld < p) return { ok: false, grund: 'Zu wenig Geld.' };
  st.geld -= p; st.felder++; return { ok: true, preis: p };
}
export function gebaeudeStufeKosten(st, id) { const b = BUILDINGS[id], s = st.gebaeude[id]; return s >= b.kosten.length ? null : b.kosten[s]; }
export function gebaeudeBauen(st, id) {
  const k = gebaeudeStufeKosten(st, id);
  if (k == null) return { ok: false, grund: 'Schon voll ausgebaut.' };
  if (st.geld < k) return { ok: false, grund: 'Zu wenig Geld.' };
  st.geld -= k; st.gebaeude[id]++; return { ok: true, preis: k };
}
