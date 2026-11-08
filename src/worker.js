// Erntezeit: Aufbruch, Online-Teil: Konten, Hof-Besuche, Gießen bei Freunden, Tauschbörse
import { PLANTS, MUT } from '../js/data.js';

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const fehler = (grund, status = 400) => json({ ok: false, grund }, status);
const jetzt = () => Date.now();

async function sha256(text) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function zufallToken() { const a = new Uint8Array(24); crypto.getRandomValues(a); return [...a].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function leseBody(req) { try { const t = await req.text(); if (t.length > 20000) return null; return JSON.parse(t); } catch (e) { return null; } }

async function spielerAusToken(env, token) {
  if (typeof token !== 'string' || token.length < 20 || token.length > 80) return null;
  const h = await sha256(token);
  const s = await env.DB.prepare('SELECT id, name FROM spieler WHERE token_hash = ?').bind(h).first();
  if (s) await env.DB.prepare('UPDATE spieler SET zuletzt = ? WHERE id = ?').bind(jetzt(), s.id).run();
  return s;
}

const NAME_OK = /^[A-Za-z0-9ÄÖÜäöüß _-]{3,16}$/;

// Gegenstände prüfen: [{ id, muts?, n }] mit gültigen Pflanzen und Mengen
function pruefeItems(liste, maxArten = 6, maxN = 40, mitMuts = true) {
  if (!Array.isArray(liste) || !liste.length || liste.length > maxArten) return null;
  const out = [];
  for (const e of liste) {
    if (!e || !PLANTS[e.id]) return null;
    const n = Math.floor(Number(e.n)); if (!(n >= 1 && n <= maxN)) return null;
    const muts = mitMuts && Array.isArray(e.muts) ? e.muts.filter(m => MUT[m]).slice(0, 4) : [];
    out.push({ id: e.id, muts, n });
  }
  return out;
}
function summeProId(items) { const m = {}; for (const e of items) m[e.id] = (m[e.id] || 0) + e.n; return m; }

// ── Pfade ───────────────────────────────────────────────
async function anmelden(env, b) {
  const name = String(b.name || '').trim().replace(/\s+/g, ' ');
  if (!NAME_OK.test(name)) return fehler('Der Name braucht 3 bis 16 Zeichen (Buchstaben, Zahlen, Leerzeichen, - und _).');
  const token = zufallToken(), t = jetzt();
  try {
    const r = await env.DB.prepare('INSERT INTO spieler (name, name_lc, token_hash, erstellt, zuletzt) VALUES (?,?,?,?,?)').bind(name, name.toLowerCase(), await sha256(token), t, t).run();
    return json({ ok: true, id: r.meta.last_row_id, name, token });
  } catch (e) { return fehler('Diesen Namen gibt es schon.'); }
}

function hofPruefen(h) {
  if (!h || typeof h !== 'object') return null;
  const tiles = Array.isArray(h.tiles) ? h.tiles.slice(0, 30).map(t => (t && PLANTS[t.id]) ? { id: t.id, f: Math.max(0, Math.min(1, +t.f || 0)), rest: Math.max(0, Math.min(1e10, +t.rest || 0)), m: (Array.isArray(t.m) ? t.m : []).filter(x => MUT[x]).slice(0, 4), w: t.w ? 1 : 0 } : null) : [];
  const g = h.gebaeude && typeof h.gebaeude === 'object' ? Object.fromEntries(Object.entries(h.gebaeude).slice(0, 10).map(([k, v]) => [String(k).slice(0, 20), Math.max(0, Math.min(5, +v || 0))])) : {};
  return { felder: Math.max(1, Math.min(30, Math.floor(+h.felder || 10))), ruf: Math.max(0, Math.min(1e6, Math.floor(+h.ruf || 0))), entdeckt: Math.max(0, Math.min(200, Math.floor(+h.entdeckt || 0))), gebaeude: g, tiles };
}
async function hofSpeichern(env, b) {
  const s = await spielerAusToken(env, b.token); if (!s) return fehler('Nicht angemeldet.', 401);
  const h = hofPruefen(b.hof); if (!h) return fehler('Ungültiger Hof.');
  await env.DB.prepare('UPDATE spieler SET hof = ?, hof_t = ? WHERE id = ?').bind(JSON.stringify(h), jetzt(), s.id).run();
  return json({ ok: true });
}
async function hoefe(env) {
  const r = await env.DB.prepare("SELECT name, zuletzt, json_extract(hof,'$.ruf') AS ruf, json_extract(hof,'$.felder') AS felder FROM spieler WHERE hof IS NOT NULL ORDER BY zuletzt DESC LIMIT 40").all();
  return json({ ok: true, hoefe: r.results });
}
async function hofLesen(env, name) {
  const r = await env.DB.prepare('SELECT name, hof, hof_t, zuletzt FROM spieler WHERE name_lc = ?').bind(String(name || '').toLowerCase()).first();
  if (!r || !r.hof) return fehler('Diesen Hof gibt es nicht.', 404);
  return json({ ok: true, name: r.name, hof: JSON.parse(r.hof), t: r.hof_t, zuletzt: r.zuletzt });
}
async function helfen(env, b) {
  const s = await spielerAusToken(env, b.token); if (!s) return fehler('Nicht angemeldet.', 401);
  const idx = Math.floor(+b.idx); if (!(idx >= 0 && idx < 30)) return fehler('Ungültiges Feld.');
  const ziel = await env.DB.prepare('SELECT id, name FROM spieler WHERE name_lc = ?').bind(String(b.name || '').toLowerCase()).first();
  if (!ziel) return fehler('Diesen Hof gibt es nicht.', 404);
  if (ziel.id === s.id) return fehler('Dein eigener Hof braucht keine Hilfe von dir.');
  const t = jetzt();
  const kurz = await env.DB.prepare('SELECT COUNT(*) AS n FROM hilfe WHERE von_id = ? AND an = ? AND t > ?').bind(s.id, ziel.id, t - 20 * 60000).first();
  if (kurz.n >= 3) return fehler('Du hast hier gerade schon geholfen. Warte ein paar Minuten.');
  const offen = await env.DB.prepare('SELECT COUNT(*) AS n FROM hilfe WHERE an = ?').bind(ziel.id).first();
  if (offen.n >= 60) return fehler('Dort wartet schon genug Hilfe.');
  await env.DB.prepare('INSERT INTO hilfe (an, von_id, von, idx, t) VALUES (?,?,?,?,?)').bind(ziel.id, s.id, s.name, idx, t).run();
  return json({ ok: true });
}
async function postAbholen(env, b) {
  const s = await spielerAusToken(env, b.token); if (!s) return fehler('Nicht angemeldet.', 401);
  const h = (await env.DB.prepare('SELECT id, von, idx, t FROM hilfe WHERE an = ? ORDER BY id LIMIT 50').bind(s.id).all()).results;
  const p = (await env.DB.prepare('SELECT id, art, inhalt, t FROM post WHERE an = ? ORDER BY id LIMIT 50').bind(s.id).all()).results;
  if (h.length) await env.DB.prepare(`DELETE FROM hilfe WHERE id IN (${h.map(() => '?').join(',')})`).bind(...h.map(x => x.id)).run();
  if (p.length) await env.DB.prepare(`DELETE FROM post WHERE id IN (${p.map(() => '?').join(',')})`).bind(...p.map(x => x.id)).run();
  return json({ ok: true, hilfe: h.map(x => ({ von: x.von, idx: x.idx })), post: p.map(x => ({ art: x.art, ...JSON.parse(x.inhalt) })) });
}

// ── Tauschbörse ─────────────────────────────────────────
async function tauschListe(env, token) {
  const s = token ? await spielerAusToken(env, token) : null;
  const r = await env.DB.prepare("SELECT a.id, a.von, a.gibt, a.will, a.t, p.name FROM angebote a JOIN spieler p ON p.id = a.von WHERE a.status = 'offen' ORDER BY a.t DESC LIMIT 60").all();
  return json({ ok: true, angebote: r.results.map(x => ({ id: x.id, von: x.name, meins: !!s && s.id === x.von, gibt: JSON.parse(x.gibt), will: JSON.parse(x.will), t: x.t })) });
}
async function tauschNeu(env, b) {
  const s = await spielerAusToken(env, b.token); if (!s) return fehler('Nicht angemeldet.', 401);
  const gibt = pruefeItems(b.gibt, 3, 40, true), will = pruefeItems(b.will, 3, 40, false);
  if (!gibt || !will) return fehler('Das Angebot ist ungültig.');
  const offen = await env.DB.prepare("SELECT COUNT(*) AS n FROM angebote WHERE von = ? AND status = 'offen'").bind(s.id).first();
  if (offen.n >= 3) return fehler('Du hast schon 3 offene Angebote.');
  const r = await env.DB.prepare('INSERT INTO angebote (von, gibt, will, t) VALUES (?,?,?,?)').bind(s.id, JSON.stringify(gibt), JSON.stringify(will), jetzt()).run();
  return json({ ok: true, id: r.meta.last_row_id });
}
async function tauschAnnehmen(env, b) {
  const s = await spielerAusToken(env, b.token); if (!s) return fehler('Nicht angemeldet.', 401);
  const a = await env.DB.prepare("SELECT id, von, gibt, will FROM angebote WHERE id = ? AND status = 'offen'").bind(Math.floor(+b.id)).first();
  if (!a) return fehler('Das Angebot gibt es nicht mehr.', 404);
  if (a.von === s.id) return fehler('Das ist dein eigenes Angebot.');
  const will = JSON.parse(a.will), geb = pruefeItems(b.gibt, 12, 200, true);
  if (!geb) return fehler('Ungültige Gegenleistung.');
  const hab = summeProId(geb), soll = summeProId(will);
  const passt = Object.keys(soll).every(id => hab[id] === soll[id]) && Object.keys(hab).every(id => soll[id] === hab[id]);
  if (!passt) return fehler('Die Gegenleistung passt nicht zum Angebot.');
  const r = await env.DB.prepare("UPDATE angebote SET status = 'getauscht' WHERE id = ? AND status = 'offen'").bind(a.id).run();
  if (!r.meta.changes) return fehler('Zu spät, das Angebot ist weg.', 409);
  await env.DB.prepare('INSERT INTO post (an, art, inhalt, t) VALUES (?,?,?,?)').bind(a.von, 'tausch', JSON.stringify({ von: s.name, items: geb }), jetzt()).run();
  return json({ ok: true, bekommt: JSON.parse(a.gibt) });
}
async function tauschZurueck(env, b) {
  const s = await spielerAusToken(env, b.token); if (!s) return fehler('Nicht angemeldet.', 401);
  const a = await env.DB.prepare("SELECT id, gibt FROM angebote WHERE id = ? AND von = ? AND status = 'offen'").bind(Math.floor(+b.id), s.id).first();
  if (!a) return fehler('Das Angebot gibt es nicht mehr.', 404);
  const r = await env.DB.prepare("UPDATE angebote SET status = 'zurueck' WHERE id = ? AND status = 'offen'").bind(a.id).run();
  if (!r.meta.changes) return fehler('Zu spät, das Angebot ist weg.', 409);
  return json({ ok: true, gibt: JSON.parse(a.gibt) });
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url), p = url.pathname;
    if (!p.startsWith('/api/')) return env.ASSETS.fetch(req);
    try {
      if (req.method === 'GET') {
        if (p === '/api/hoefe') return await hoefe(env);
        if (p === '/api/hof') return await hofLesen(env, url.searchParams.get('name'));
        if (p === '/api/ping') return json({ ok: true, t: jetzt() });
        return fehler('Unbekannt.', 404);
      }
      if (req.method !== 'POST') return fehler('Nicht erlaubt.', 405);
      const b = await leseBody(req); if (!b) return fehler('Ungültige Anfrage.');
      switch (p) {
        case '/api/anmelden': return await anmelden(env, b);
        case '/api/hof': return await hofSpeichern(env, b);
        case '/api/helfen': return await helfen(env, b);
        case '/api/post': return await postAbholen(env, b);
        case '/api/tausch': return await tauschListe(env, b.token);
        case '/api/tausch/neu': return await tauschNeu(env, b);
        case '/api/tausch/annehmen': return await tauschAnnehmen(env, b);
        case '/api/tausch/zurueck': return await tauschZurueck(env, b);
      }
      return fehler('Unbekannt.', 404);
    } catch (e) { return fehler('Serverfehler.', 500); }
  },
};
