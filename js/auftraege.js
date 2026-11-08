// Bestellungen aus dem Dorf: Ernte abliefern gegen Geld und Ruf
import { PLANTS, PLANT_IDS, RARITIES, HIDDEN, STUNDE } from './data.js';
import { rng, hash32, freigeschaltet, mutMult, itemKey } from './logic.js';

export const AUFTRAG_SLOTS = 3, AUFTRAG_DAUER = 3 * STUNDE;

function neuerAuftrag(st, now, nr) {
  const R = rng(hash32(Math.floor(now / 1000) + nr * 977 + st.stat.auftraege * 31));
  const frei = freigeschaltet(st), bis = frei.length - 1;
  // Bevorzugt Seltenheiten der unteren und mittleren Stufen
  const pool = PLANT_IDS.filter(id => !HIDDEN.includes(PLANTS[id].rar) && frei.includes(PLANTS[id].rar));
  const ids = pool.filter(id => !st.auftraege.some(a => a.id === id));
  const liste = ids.length ? ids : pool;
  const id = liste[Math.floor(R() * liste.length)], p = PLANTS[id];
  const ri = RARITIES.indexOf(p.rar);
  const basis = ri <= 1 ? [3, 7] : ri === 2 ? [2, 4] : [1, 3];
  const n = basis[0] + Math.floor(R() * (basis[1] - basis[0] + 1));
  const mut = R() < 0.22;
  const wert = p.wert * n * (mut ? 3.4 : 1.7);
  return { id, n, mut, lohn: Math.round(wert), ruf: 2 + (mut ? 2 : 0) + Math.floor(ri / 2), bis: now + AUFTRAG_DAUER };
}
export function auftraegeAuffuellen(st, now) {
  st.auftraege = st.auftraege.filter(a => a.bis > now);
  let nr = 0; while (st.auftraege.length < AUFTRAG_SLOTS) { st.auftraege.push(neuerAuftrag(st, now, nr++)); }
}
export function passende(st, a) {
  return st.lager.filter(e => e.id === a.id && (!a.mut || e.muts.length > 0));
}
export function habe(st, a) { return passende(st, a).reduce((s, e) => s + e.n, 0); }
export function liefern(st, i, now) {
  const a = st.auftraege[i]; if (!a) return { ok: false, grund: 'Auftrag weg.' };
  if (habe(st, a) < a.n) return { ok: false, grund: 'Du hast noch nicht genug davon.' };
  // zuerst die mit den wenigsten Mutationen abgeben
  const items = passende(st, a).sort((x, y) => mutMult(x.muts) - mutMult(y.muts));
  let rest = a.n;
  for (const e of items) { const t = Math.min(rest, e.n); e.n -= t; rest -= t; if (rest <= 0) break; }
  st.lager = st.lager.filter(e => e.n > 0);
  st.geld += a.lohn; st.ruf += a.ruf; st.stat.auftraege++; st.stat.verdient += a.lohn;
  st.auftraege.splice(i, 1); auftraegeAuffuellen(st, now);
  return { ok: true, lohn: a.lohn, ruf: a.ruf };
}
