// Aufbruch: Reisen in neue Gebiete bringen Samen (auch solche, die der Markt noch nicht verkauft)
import { PLANTS, RARITIES, RARITY_WEIGHT, MIN, STUNDE } from './data.js';
import { rng, hash32, eintrag } from './logic.js';

export const GEBIETE = [
  { id: 'wald', name: 'Waldrand', ruf: 0, farbe: '#5fae3a', mut: 'nass', text: 'Moos, Pilze und alte Bäume.',
    pool: ['moosblatt', 'pilz', 'kastanie', 'erdbeere', 'blaubeere', 'salat', 'erbsenschote', 'bohnen', 'apfel', 'birne', 'kirsche', 'mandragora', 'geisterkraut'] },
  { id: 'sumpf', name: 'Sumpf', ruf: 10, farbe: '#6a8a4a', mut: 'riesig', text: 'Nebliges Wasser und fette Wurzeln.',
    pool: ['ruebe', 'kartoffel', 'suesskartoffel', 'bambus', 'ingwer', 'aubergine', 'avocado', 'gurke', 'nebelrose', 'schattenblatt', 'mandragora'] },
  { id: 'wueste', name: 'Wüste', ruf: 30, farbe: '#d8a64a', mut: 'reif', text: 'Hitze, Dünen und süße Früchte.',
    pool: ['kaktus', 'drachenfrucht', 'ananas', 'mango', 'kokosnuss', 'olive', 'wassermelone', 'melone', 'paprika', 'sonnenblume', 'feuerrose', 'sonnenfeder'] },
  { id: 'berge', name: 'Bergpass', ruf: 75, farbe: '#7a9ac0', mut: 'frostig', text: 'Kalte Luft und seltene Blüten.',
    pool: ['edelweiss', 'eisblume', 'kastanie', 'lavendel', 'ingwer', 'knoblauch', 'mondblüte', 'donnerdistel', 'kristallrose', 'weltbaum'] },
  { id: 'moor', name: 'Nebelmoor', ruf: 175, farbe: '#8a7ab8', mut: 'lunar', text: 'Hier flüstern die Pflanzen.',
    pool: ['geisterkraut', 'nebelrose', 'schattenblatt', 'traumwinde', 'himmelstraube', 'glanzkraut', 'seelenblume', 'aetherwurzel', 'ewigelotus'] },
  { id: 'hoehle', name: 'Kristallhöhle', ruf: 280, farbe: '#d86ac8', mut: 'gold', text: 'Alles funkelt und leuchtet.',
    pool: ['kristallrose', 'lichtkelch', 'regenbogenkraut', 'prismatic', 'voidblume', 'leerebluete', 'zeitkraut'] },
  { id: 'insel', name: 'Himmelsinsel', ruf: 400, farbe: '#6ac8e8', mut: 'geladen', text: 'Ganz oben, wo die Welt anfängt.',
    pool: ['sonnenkern', 'mondkern', 'sternenkern', 'sternenflamme', 'ewigelotus', 'weltbaum', 'voidblume'],
    geheim: [['galaxiebluete', 0.01], ['urweltfarn', 0.005], ['omegarose', 0.0015]] },
];
export const DAUER = [
  { name: 'Kurz', ms: 10 * MIN, f: 1, seeds: [2, 3], bonus: 1 },
  { name: 'Mittel', ms: 30 * MIN, f: 2.2, seeds: [4, 6], bonus: 1.6 },
  { name: 'Lang', ms: 2 * STUNDE, f: 5, seeds: [8, 12], bonus: 2.6 },
];
export const EREIGNISSE = [
  { titel: 'Wegkreuzung', text: 'Der Pfad teilt sich: links ein breiter, sicherer Weg, rechts eine steile Abkürzung.',
    a: { label: 'Sicherer Weg', mod: () => ({ text: 'Du kommst ruhig voran.' }) },
    b: { label: 'Abkürzung wagen', mod: R => R() < 0.5 ? { mult: 1.5, mutPlus: 0.3, text: 'Die Abkürzung hat sich gelohnt!' } : { mult: 0.6, text: 'Du hast dich verlaufen und Samen verloren.' } } },
  { titel: 'Verletztes Tier', text: 'Am Wegrand liegt ein verletztes Tier und schaut dich an.',
    a: { label: 'Helfen', mod: () => ({ ruf: 3, text: 'Das Tier ist dankbar. Im Dorf wird über dich geredet.' }) },
    b: { label: 'Weitergehen', mod: () => ({ extra: 1, text: 'Du bist schneller und findest einen Samen mehr.' }) } },
  { titel: 'Glitzernder Fund', text: 'Unter einem Stein blitzt etwas.',
    a: { label: 'Behalten', mod: (R, g) => ({ geld: Math.round((15 + R() * 30) * Math.pow(2.2, g)), text: 'Ein hübscher Fund, der sich gut verkaufen lässt.' }) },
    b: { label: 'Im Dorf abgeben', mod: () => ({ ruf: 2, geld: 10, text: 'Der Besitzer bedankt sich.' }) } },
  { titel: 'Unwetter', text: 'Dunkle Wolken ziehen auf.',
    a: { label: 'Abwarten', mod: () => ({ mult: 0.8, text: 'Du hast gewartet und etwas weniger gesammelt.' }) },
    b: { label: 'Durchmarschieren', mod: R => R() < 0.7 ? { selten: 2.5, text: 'Mutig! Bei diesem Wetter findet man Seltenes.' } : { mult: 0.5, text: 'Der Sturm hat einen Teil weggeweht.' } } },
  { titel: 'Geheimer Pfad', text: 'Hinter dichtem Gebüsch führt ein schmaler Pfad weiter.',
    a: { label: 'Folgen', mod: R => R() < 0.35 ? { extra: 2, mutPlus: 0.4, text: 'Ein verstecktes Beet! Zwei Samen mehr, einer funkelt.' } : { text: 'Der Pfad endet im Nichts, aber der Ausflug war schön.' } },
    b: { label: 'Auf dem Weg bleiben', mod: () => ({ mult: 1.1, text: 'Du sammelst in Ruhe ein bisschen mehr.' }) } },
];

export const slots = st => 1 + (st.gebaeude.karawane || 0);
export const gebietOffen = (st, gi) => st.ruf >= GEBIETE[gi].ruf;
export const reiseKosten = (gi, di) => Math.round(10 * Math.pow(3, gi) * DAUER[di].f);
export function hoechsteSeltenheit(gi) { const g = GEBIETE[gi]; let m = 0; for (const id of g.pool) m = Math.max(m, RARITIES.indexOf(PLANTS[id].rar)); return RARITIES[m]; }

export function reiseStarten(st, gi, di, now) {
  if (!gebietOffen(st, gi)) return { ok: false, grund: 'Dieses Gebiet kennst du noch nicht. Du brauchst mehr Ruf.' };
  if (st.reisen.length >= slots(st)) return { ok: false, grund: 'Alle Wagen sind unterwegs. Baue das Wagenhaus aus.' };
  const k = reiseKosten(gi, di); if (st.geld < k) return { ok: false, grund: 'Zu wenig Geld für den Proviant.' };
  st.geld -= k;
  st.reisen.push({ gi, di, start: now, ende: now + DAUER[di].ms, seed: hash32(Math.floor(now / 1000) * 31 + gi * 131 + (st.stat.reisen || 0) * 7919) });
  return { ok: true, preis: k };
}
export const reiseBereit = (r, now) => now >= r.ende;
export const ereignisIndex = r => hash32(r.seed ^ 0x5bd1e995) % EREIGNISSE.length;

export function reiseAbschliessen(st, ri, wahl, now) {
  const r = st.reisen[ri]; if (!r) return { ok: false, grund: 'Keine Reise.' };
  if (!reiseBereit(r, now)) return { ok: false, grund: 'Noch unterwegs.' };
  const G = GEBIETE[r.gi], D = DAUER[r.di], R = rng(r.seed + 17);
  const ev = EREIGNISSE[ereignisIndex(r)], mod = (wahl === 'b' ? ev.b : ev.a).mod(R, r.gi) || {};
  let n = D.seeds[0] + Math.floor(R() * (D.seeds[1] - D.seeds[0] + 1));
  n = Math.max(1, Math.round(n * (mod.mult || 1))) + (mod.extra || 0);
  const gew = G.pool.map(id => { const p = PLANTS[id]; return RARITY_WEIGHT[p.rar] * (p.rar === 'gewöhnlich' ? 1 : D.bonus * (mod.selten || 1)); });
  const summe = gew.reduce((a, b) => a + b, 0), samen = [];
  const dazu = (id, muts) => { eintrag(samen, id, muts, 1); };
  for (let i = 0; i < n; i++) {
    let x = R() * summe, k = 0; for (; k < gew.length - 1; k++) { x -= gew[k]; if (x <= 0) break; }
    dazu(G.pool[k], R() < 0.18 + (mod.mutPlus || 0) ? [G.mut] : []);
  }
  for (const [id, c] of (G.geheim || [])) if (R() < c * D.bonus) dazu(id, []);
  for (const e of samen) eintrag(st.samen, e.id, e.muts, e.n);
  st.geld += mod.geld || 0; st.ruf += (mod.ruf || 0) + 1 + r.di;
  st.reisen.splice(ri, 1); st.stat.reisen = (st.stat.reisen || 0) + 1;
  return { ok: true, samen, geld: mod.geld || 0, ruf: (mod.ruf || 0) + 1 + r.di, text: mod.text || '' };
}
