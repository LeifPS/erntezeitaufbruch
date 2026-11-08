import { PLANTS, PLANT_IDS, RARITIES, HIDDEN, RARITY_COLOR, MUT, SEASONS, SEASON_KEYS, BUILDINGS, START, MIN, STUNDE, feldPreis, LAGER_STUFEN } from './data.js';
import * as L from './logic.js';
import * as Art from './art.js';
import * as Rz from './reisen.js';
import * as Au from './auftraege.js';
import { api } from './online.js';

const COLS = START.spalten;
const $ = s => document.querySelector(s);
const fmt = n => Math.round(n).toLocaleString('de-DE');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function dauer(ms) {
  const m = Math.ceil(ms / MIN);
  if (m < 60) return m + ' Min';
  const h = Math.floor(m / 60), r = m % 60;
  if (h < 24) return h + ' Std' + (r ? ' ' + r + ' Min' : '');
  const d = Math.floor(h / 24); return d + ' T' + (h % 24 ? ' ' + (h % 24) + ' Std' : '');
}

// ── Spielstand laden ───────────────────────────────────
let st;
const now0 = Date.now();
try {
  const raw = localStorage.getItem(L.SAVE_KEY);
  st = raw ? L.migriere(JSON.parse(raw)) : null;
} catch (e) { st = null; }
let neu = false;
if (!st) {
  st = L.neuerStand(now0); neu = true;
  st.samen.push({ id: 'karotte', muts: [], n: 3 }, { id: 'salat', muts: [], n: 2 });
}
function speichern() { try { localStorage.setItem(L.SAVE_KEY, JSON.stringify(st)); } catch (e) { } }

// ── Zustand der Oberfläche ─────────────────────────────
let sel = null;            // gewählter Samen (Schlüssel)
let panel = null;          // offenes Panel
let panelArg = null;
let lagerReiter = 'ernte';
let indexFilter = 'alle';
let ergebnis = null;
let onlineReiter = 'besuch';
let hoefeListe = null, tauschListe = null, besuchHof = null, onlineMeldung = '';
const floats = [];

// ── Ton ────────────────────────────────────────────────
let ac = null;
function ton(art) {
  if (!st.einst.ton) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    if (ac.state === 'suspended') ac.resume();
    const t = ac.currentTime;
    const note = (f, d, at = 0, typ = 'triangle', v = 0.12) => { const o = ac.createOscillator(), g = ac.createGain(); o.type = typ; o.frequency.value = f; g.gain.setValueAtTime(v, t + at); g.gain.exponentialRampToValueAtTime(0.001, t + at + d); o.connect(g).connect(ac.destination); o.start(t + at); o.stop(t + at + d); };
    if (art === 'pflanzen') { note(300, 0.12); note(420, 0.1, 0.06); }
    else if (art === 'ernte') { note(520, 0.1); note(660, 0.1, 0.07); note(880, 0.16, 0.14); }
    else if (art === 'geld') { note(988, 0.07, 0, 'square', 0.07); note(1319, 0.2, 0.07, 'square', 0.07); }
    else if (art === 'giessen') { const b = ac.createBuffer(1, ac.sampleRate * 0.25, ac.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length); const s = ac.createBufferSource(); s.buffer = b; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; const g = ac.createGain(); g.gain.value = 0.15; s.connect(f).connect(g).connect(ac.destination); s.start(t); }
    else if (art === 'kauf') { note(660, 0.06, 0, 'square', 0.07); note(880, 0.08, 0.06, 'square', 0.07); note(1175, 0.22, 0.13, 'square', 0.07); }
    else if (art === 'fehler') note(150, 0.18, 0, 'sawtooth', 0.08);
    else if (art === 'bauen') { note(392, 0.1); note(523, 0.1, 0.09); note(784, 0.2, 0.18); }
  } catch (e) { }
}
window.LGH_ZEILEN = () => [{ text: 'Ton', an: !!st.einst.ton, setze: v => { st.einst.ton = !!v; speichern(); } }];

// ── Hinweis & Meldungen ────────────────────────────────
let toastT = 0;
function meldung(text, fehler = false) {
  const el = $('#toast'); el.textContent = (fehler ? '✕ ' : '✓ ') + text; el.className = 'an' + (fehler ? ' fehler' : '');
  clearTimeout(toastT); toastT = setTimeout(() => el.className = '', 2800);
  if (fehler) ton('fehler');
}
function floatText(idx, txt, farbe = '#fff') { const c = tilePos(idx); floats.push({ x: c.x + ts / 2, y: c.y + ts * 0.3, txt, farbe, t0: performance.now() }); }

// ── Zeichenfläche ──────────────────────────────────────
const cv = $('#hof'), ctx = cv.getContext('2d');
let W = 0, H = 0, ts = 0, skyH = 0, gy0 = 0, rows = 0, dpr = 1, gx0 = 0;
function layout() {
  const wrap = $('#hofwrap');
  const avail = Math.min(wrap.clientWidth || 360, 640);
  ts = Math.floor(avail / COLS); W = ts * COLS; gx0 = 0;
  rows = Math.min(START.felderMax / COLS, Math.ceil(Math.min(st.felder + 1, START.felderMax) / COLS));
  skyH = Math.round(ts * 1.7); gy0 = skyH + Math.round(ts * 0.2); H = gy0 + rows * ts + Math.round(ts * 0.25);
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
}
function tilePos(i) { return { x: gx0 + (i % COLS) * ts, y: gy0 + Math.floor(i / COLS) * ts }; }

let last = 0, lastRows = 0;
function frame(tms) {
  requestAnimationFrame(frame);
  if (tms - last < 32) return; last = tms;
  const now = Date.now(), season = L.seasonAt(now), weather = L.weatherAt(now);
  if (rows !== Math.min(START.felderMax / COLS, Math.ceil(Math.min(st.felder + 1, START.felderMax) / COLS))) layout();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  Art.drawWorld(ctx, W, H, { now, season, weather, ts, skyH, gebaeude: st.gebaeude });
  const total = Math.min(START.felderMax, rows * COLS), glas = L.glasFelder(st);
  for (let i = 0; i < total; i++) {
    const p = tilePos(i), owned = i < st.felder, tile = st.tiles[i];
    Art.drawTileBase(ctx, p.x, p.y, ts, { boden: st.boden[i], wasser: st.wasser[i], season, owned, kosten: i === st.felder ? feldPreis(st.felder) : null, kaufbar: st.geld >= feldPreis(st.felder) });
  }
  for (let i = 0; i < total; i++) {
    const tile = st.tiles[i]; if (!tile || i >= st.felder) continue;
    const p = tilePos(i);
    Art.drawPlant(ctx, tile, p.x + ts / 2, p.y + ts * 0.8, ts * 0.92, tms, i * 7 + 3, { wind: weather === 'gewitter' ? 3 : weather === 'regen' ? 1.6 : 1 });
    if (L.istReif(tile)) Art.drawReadyMark(ctx, p.x, p.y, ts, tms);
    else if (st.wasser[i] <= 0) { if (Math.floor(tms / 500) % 2) Art.drawDrop(ctx, p.x + 14, p.y + 16, 9, '#6ec6ff'); }
  }
  if (glas > 0) { const gr = Math.min(rows, Math.ceil(glas / COLS)); Art.drawGlasRoof(ctx, gx0, gy0, ts, COLS, gr); }
  Art.drawWeatherFx(ctx, W, H, weather, now);
  // schwebende Texte
  const pn = performance.now();
  for (let k = floats.length - 1; k >= 0; k--) {
    const f = floats[k], a = (pn - f.t0) / 1300; if (a >= 1) { floats.splice(k, 1); continue; }
    ctx.globalAlpha = 1 - a * a; ctx.font = `800 ${Math.round(ts * 0.26)}px system-ui,sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = '#2b2418'; ctx.strokeText(f.txt, f.x, f.y - a * ts * 0.9); ctx.fillStyle = f.farbe; ctx.fillText(f.txt, f.x, f.y - a * ts * 0.9); ctx.globalAlpha = 1;
  }
}

// ── Online ─────────────────────────────────────────────
function hofSnapshot(now) {
  return { felder: st.felder, ruf: st.ruf, entdeckt: Object.keys(st.entdeckt).length, gebaeude: st.gebaeude,
    tiles: st.tiles.slice(0, st.felder).map((t, i) => t ? { id: t.id, f: t.prog / t.total, rest: Math.round(L.restZeit(st, i, now)), m: t.muts, w: st.wasser[i] > 0 ? 1 : 0 } : null) };
}
let lastUpload = 0, lastPost = 0, onlineBusy = false;
async function onlineSync(force = false) {
  if (!st.online || onlineBusy) return; const now = Date.now(); onlineBusy = true;
  try {
    if (force || now - lastUpload > 90000) { lastUpload = now; await api('hof', { token: st.online.token, hof: hofSnapshot(now) }); }
    if (force || now - lastPost > 20000) {
      lastPost = now; const r = await api('post', { token: st.online.token });
      if (r.ok) {
        for (const h of r.hilfe) { if (h.idx < st.felder && st.tiles[h.idx]) { st.wasser[h.idx] = 1; st.boden[h.idx] = Math.min(100, st.boden[h.idx] + 10); floatText(h.idx, h.von + ' hat geholfen', '#9fd8ff'); } meldung(`${h.von} hat dein Feld gegossen!`); }
        for (const p of r.post) if (p.art === 'tausch') { L.lagerHinzu(st, p.items); meldung(`${p.von} hat mit dir getauscht: ${itemsText(p.items)}`); ton('geld'); }
        if (r.hilfe.length || r.post.length) { speichern(); if (panel === 'online') renderPanel(); }
      }
    }
  } finally { onlineBusy = false; }
}
function itemsText(items) { return items.map(e => `${e.n}× ${PLANTS[e.id].name}${e.muts && e.muts.length ? ' (' + e.muts.map(m => MUT[m].name).join(', ') + ')' : ''}`).join(', '); }
function vor(t) { const m = Math.max(0, Math.round((Date.now() - t) / MIN)); return m < 2 ? 'gerade eben' : m < 60 ? 'vor ' + m + ' Min' : m < 1440 ? 'vor ' + Math.round(m / 60) + ' Std' : 'vor ' + Math.round(m / 1440) + ' T'; }
async function ladeOnline() {
  if (onlineReiter === 'besuch') { const r = await api('hoefe'); hoefeListe = r.ok ? r.hoefe : null; onlineMeldung = r.ok ? '' : (r.grund || ''); }
  else { const r = await api('tausch', { token: st.online ? st.online.token : '' }); tauschListe = r.ok ? r.angebote : null; onlineMeldung = r.ok ? '' : (r.grund || ''); }
  if (panel === 'online') renderPanel();
}

// ── Spielschleife (Logik, Kopfzeile, Speichern) ─────────
let ereignisAnzahl = 0;
function logikTick() {
  const now = Date.now();
  const ev = L.tick(st, now) || [];
  Au.auftraegeAuffuellen(st, now);
  for (const e of ev) if (e.m === 'gold' || e.m === 'regenbogen' || e.m === 'geladen') { floatText(e.idx, MUT[e.m].name + '!', '#ffe27a'); }
  kopfAktualisieren(now);
  onlineSync();
  if (panel === 'besuchhof') zeichneBesuch();
  if ((panel === 'aufbruch' || panel === 'auftraege') && Math.floor(now / 1000) % 5 === 0) renderPanel();
}
function kopfAktualisieren(now = Date.now()) {
  $('#v-geld').textContent = fmt(st.geld);
  const rs = L.rufStufe(st); $('#v-ruf').textContent = st.ruf; $('#p-ruf').title = 'Händler-Ruf: ' + rs.name;
  const s = L.seasonAt(now), w = L.weatherAt(now), d = new Date(now);
  $('#v-wetter').textContent = `${SEASONS[s]} · ${L.WETTER_NAME[w]}`;
  const ln = L.lagerAnzahl(st), el = $('#n-lager'); el.style.display = ln ? 'block' : 'none'; el.textContent = ln;
  // Auswahl-Chip
  const a = $('#auswahl');
  if (sel && !L.seedAnzahl(st, sel)) sel = null;
  if (sel) {
    const e = st.samen.find(x => L.itemKey(x.id, x.muts) === sel);
    if (!a.dataset.key || a.dataset.key !== sel || a.dataset.n !== String(e.n)) {
      a.dataset.key = sel; a.dataset.n = String(e.n);
      a.innerHTML = `<div class="chip"><canvas width="76" height="76"></canvas><span>${esc(PLANTS[e.id].name)} × ${e.n}</span><button class="knopf grau klein" data-act="abwaehlen">Fertig</button></div>`;
      Art.plantIcon(a.querySelector('canvas'), e.id, e.muts);
    }
  } else if (a.innerHTML) { a.innerHTML = ''; a.dataset.key = ''; a.dataset.n = ''; }
  const bereit = st.reisen.filter(r => Rz.reiseBereit(r, now)).length, el2 = $('#n-reise'); el2.style.display = bereit ? 'block' : 'none'; el2.textContent = bereit;
  const lief = st.auftraege.filter(a => Au.habe(st, a) >= a.n).length, el3 = $('#n-auf'); el3.style.display = lief ? 'block' : 'none'; el3.textContent = lief;
  $('#hinweis').textContent = hinweis(now);
  if (panel === 'markt') marktZeit();
}
function hinweis(now) {
  const n = st.tiles.slice(0, st.felder).filter(t => t).length, reif = st.tiles.slice(0, st.felder).filter(t => L.istReif(t)).length;
  if (reif) return `${reif} ${reif === 1 ? 'Pflanze ist' : 'Pflanzen sind'} reif. Tippe darauf zum Ernten!`;
  if (sel) return 'Tippe auf ein leeres Feld, um zu pflanzen.';
  if (st.samen.length && n < st.felder) return 'Wähle im Lager Samen aus und pflanze sie.';
  if (!st.samen.length && !n) return 'Kauf dir im Markt neue Samen.';
  const dry = st.tiles.slice(0, st.felder).filter((t, i) => t && !L.istReif(t) && st.wasser[i] <= 0).length;
  if (dry) return 'Durstige Pflanzen wachsen nur halb so schnell. Tippe zum Gießen!';
  return 'Alles wächst. Schau im Markt vorbei, er wechselt jede volle Stunde.';
}

// ── Eingabe auf dem Hof ────────────────────────────────
cv.addEventListener('click', ev => {
  const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) * (W / r.width), y = (ev.clientY - r.top) * (H / r.height);
  const col = Math.floor((x - gx0) / ts), row = Math.floor((y - gy0) / ts);
  if (col < 0 || col >= COLS || row < 0 || row >= rows || y < gy0) return;
  const idx = row * COLS + col; if (idx >= START.felderMax) return;
  tippFeld(idx);
});
function tippFeld(idx) {
  const now = Date.now();
  if (idx >= st.felder) {
    if (idx > st.felder) return meldung('Kauf zuerst das Feld davor.', true);
    const res = L.feldKaufen(st);
    if (!res.ok) return meldung(res.grund + ` (${fmt(feldPreis(st.felder))} €)`, true);
    ton('bauen'); meldung('Neues Feld gekauft!'); speichern(); return;
  }
  const tile = st.tiles[idx];
  if (!tile) {
    if (!sel) { if (st.samen.length) { openPanel('lager'); lagerReiter = 'samen'; renderPanel(); } else { meldung('Du hast keine Samen. Kauf welche im Markt.', true); openPanel('markt'); } return; }
    const res = L.pflanzen(st, idx, sel, now);
    if (!res.ok) return meldung(res.grund, true);
    ton('pflanzen'); floatText(idx, res.mono ? 'Monokultur!' : 'Gepflanzt', res.mono ? '#ffb199' : '#fff');
    if (res.neu) meldung(PLANTS[tile ? tile.id : st.tiles[idx].id].name + ' entdeckt!');
    speichern(); return;
  }
  if (L.istReif(tile)) {
    const res = L.ernten(st, idx);
    if (!res.ok) return meldung(res.grund, true);
    ton('ernte'); floatText(idx, `+${res.menge} ${PLANTS[res.id].name}`, '#fff6b0'); if (res.verwelkt) floatText(idx, 'Verwelkt', '#d8c8a0');
    speichern(); return;
  }
  if (st.wasser[idx] < 0.5) { L.giessen(st, idx); ton('giessen'); floatText(idx, 'Gegossen', '#9fd8ff'); return; }
  panelArg = idx; openPanel('feld');
}

// ── Panels ─────────────────────────────────────────────
const bl = $('#blatt'), blInhalt = $('#blatt-inhalt'), blTitel = $('#blatt-titel');
function openPanel(name) { panel = name; bl.hidden = false; renderPanel(); document.querySelectorAll('#dock button').forEach(b => b.classList.toggle('an', b.dataset.panel === name)); }
function closePanel() { panel = null; bl.hidden = true; document.querySelectorAll('#dock button').forEach(b => b.classList.remove('an')); }
function badge(rar) { const c = RARITY_COLOR[rar]; const hell = ['göttlich', 'legendär', 'absolut'].includes(rar); return `<span class="badge${hell ? ' hell' : ''}" style="background:${c === 'rainbow' ? 'linear-gradient(90deg,#ff7a7a,#ffd84a,#6fd04a,#4aa8ff,#b06aff)' : c}">${rar}</span>`; }
function mutChips(muts) { return (muts || []).map(m => `<span class="mut" style="border-color:#2b2418;background:${MUT[m].farbe === 'rainbow' ? 'linear-gradient(90deg,#ffd0d0,#fff3b0,#d0f5c0,#c0e0ff)' : MUT[m].farbe + '55'}">${MUT[m].name}</span>`).join(' '); }
function pi(id, muts = []) { return `<canvas class="pi" width="108" height="108" data-pi="${id}" data-muts="${(muts || []).join(',')}"></canvas>`; }

function renderPanel() {
  if (!panel) return;
  const now = Date.now(); let html = '', titel = '';
  if (panel === 'markt') { titel = 'Samen-Markt'; html = htmlMarkt(now); }
  else if (panel === 'lager') { titel = 'Lager'; html = htmlLager(now); }
  else if (panel === 'auftraege') { titel = 'Aufträge aus dem Dorf'; html = htmlAuftraege(now); }
  else if (panel === 'aufbruch') { titel = 'Aufbruch'; html = htmlAufbruch(now); }
  else if (panel === 'ereignis') { titel = 'Unterwegs'; html = htmlEreignis(); }
  else if (panel === 'ergebnis') { titel = 'Zurück vom Aufbruch'; html = htmlErgebnis(); }
  else if (panel === 'online') { titel = 'Online'; html = htmlOnline(now); }
  else if (panel === 'besuchhof') { titel = besuchHof ? 'Hof von ' + besuchHof.name : 'Hof'; html = htmlBesuchHof(); }
  else if (panel === 'bauen') { titel = 'Hof ausbauen'; html = htmlBauen(); }
  else if (panel === 'index') { titel = 'Pflanzen-Index'; html = htmlIndex(); }
  else if (panel === 'pflanze') { titel = PLANTS[panelArg].name; html = htmlPflanze(panelArg); }
  else if (panel === 'feld') { titel = 'Feld'; html = htmlFeld(panelArg, now); }
  else if (panel === 'ruf') { titel = 'Händler-Ruf'; html = htmlRuf(); }
  else if (panel === 'willkommen') { titel = 'Willkommen auf deinem Hof!'; html = htmlWillkommen(); }
  blTitel.textContent = titel;
  const sc = blInhalt.scrollTop; blInhalt.innerHTML = html; blInhalt.scrollTop = sc;
  blInhalt.querySelectorAll('canvas[data-pi]').forEach(c => Art.plantIcon(c, c.dataset.pi, c.dataset.muts ? c.dataset.muts.split(',') : []));
  if (panel === 'besuchhof') zeichneBesuch();
  kopfAktualisieren(now);
}
function marktZeit() { const el = document.getElementById('markt-zeit'); if (el) el.textContent = dauer(L.naechsterMarkt(Date.now())); }

function htmlMarkt(now) {
  const sort = L.marktSortiment(st, now), nr = L.naechsteRuf(st), season = L.seasonAt(now);
  let h = `<div class="karte"><div class="mitte"><div class="name">Neue Ware in&nbsp;<span id="markt-zeit">${dauer(L.naechsterMarkt(now))}</span></div><div class="klein">Der Markt wechselt zur vollen Stunde und ist für alle Spieler gleich.</div></div></div>`;
  h += `<h3>Heute im Angebot</h3>`;
  for (const s of sort) {
    const p = PLANTS[s.id], inSeason = p.saison === SEASON_KEYS[season];
    h += `<div class="karte">${pi(s.id)}<div class="mitte"><div class="name">${esc(p.name)} ${badge(p.rar)}</div>
      <div class="klein">Wächst ${dauer(p.min * MIN)} · ${p.typ === 'm' ? 'mehrfach ernten' : 'einmal ernten'} · ${p.saison === 'a' ? 'jede Jahreszeit' : 'mag ' + SEASONS[SEASON_KEYS.indexOf(p.saison)] + (inSeason ? ' (jetzt!)' : '')}</div>
      <div class="klein">Verkauf ca. ${fmt(p.wert)} € · noch ${s.uebrig}</div><div class="klein beutel">Im Beutel: <b>${L.seedAnzahl(st, L.itemKey(s.id, []))}</b></div></div>
      <div class="rechts"><button class="knopf gold klein" data-act="kaufen" data-id="${s.id}" data-n="1" ${s.uebrig < 1 || st.geld < p.preis ? 'disabled' : ''}>${fmt(p.preis)} €</button>
      ${s.uebrig >= 5 ? `<button class="knopf blau klein" data-act="kaufen" data-id="${s.id}" data-n="5" ${st.geld < p.preis * 5 ? 'disabled' : ''}>×5</button>` : ''}</div></div>`;
  }
  const k = PLANTS.karotte;
  h += `<h3>Immer da</h3><div class="karte">${pi('karotte')}<div class="mitte"><div class="name">Grundsaat Karotte</div><div class="klein">Damit du nie festsitzt.</div><div class="klein beutel">Im Beutel: <b>${L.seedAnzahl(st, L.itemKey('karotte', []))}</b></div></div><div class="rechts"><button class="knopf gold klein" data-act="kaufen" data-id="karotte-grund" data-n="1" ${st.geld < k.preis ? 'disabled' : ''}>${k.preis} €</button><button class="knopf blau klein" data-act="kaufen" data-id="karotte-grund" data-n="5" ${st.geld < k.preis * 5 ? 'disabled' : ''}>×5</button></div></div>`;
  if (nr) h += `<div class="info">Mehr Ruf schaltet seltenere Samen frei. Nächste Stufe „${nr.name}“ ab ${nr.ab} Ruf (du hast ${st.ruf}).</div>`;
  return h;
}
function htmlLager(now) {
  let h = `<div class="reiter"><button class="${lagerReiter === 'ernte' ? 'an' : ''}" data-act="reiter" data-r="ernte">Ernte (${L.lagerAnzahl(st)}/${L.lagerMax(st)})</button><button class="${lagerReiter === 'samen' ? 'an' : ''}" data-act="reiter" data-r="samen">Samen (${st.samen.reduce((a, s) => a + s.n, 0)})</button></div>`;
  if (lagerReiter === 'ernte') {
    if (!st.lager.length) return h + `<div class="leer">Noch nichts geerntet.</div>`;
    let summe = 0;
    for (const e of st.lager) {
      const p = PLANTS[e.id], preis = L.preisFuer(st, e.id, e.muts, now), key = L.itemKey(e.id, e.muts); summe += preis * e.n;
      const nf = L.nachfrageFaktor(st, e.id, now);
      h += `<div class="karte">${pi(e.id, e.muts)}<div class="mitte"><div class="name">${esc(p.name)} × ${e.n}</div><div class="klein">${mutChips(e.muts) || 'ohne Mutation'}</div><div class="klein">${fmt(preis)} € pro Stück${nf < 0.97 ? ' · Preis gedrückt' : ''}</div></div>
        <div class="rechts"><button class="knopf gold klein" data-act="verkauf" data-key="${esc(key)}" data-n="1">1 verkaufen</button>${e.n > 1 ? `<button class="knopf grau klein" data-act="verkauf" data-key="${esc(key)}" data-n="${e.n}">alle</button>` : ''}</div></div>`;
    }
    h += `<button class="knopf gold" data-act="allesverkaufen">Alles verkaufen (ca. ${fmt(summe)} €)</button>`;
    h += `<div class="info">Verkaufst du viele gleiche Pflanzen auf einmal, sinkt ihr Preis kurz. Danach erholt er sich.</div>`;
    return h;
  }
  if (!st.samen.length) return h + `<div class="leer">Keine Samen. Im Markt gibt es neue.</div>`;
  for (const e of st.samen) {
    const p = PLANTS[e.id], key = L.itemKey(e.id, e.muts);
    h += `<div class="karte">${pi(e.id)}<div class="mitte"><div class="name">${esc(p.name)} × ${e.n}</div><div class="klein">Wächst ${dauer(p.min * MIN)} · ${p.typ === 'm' ? 'mehrfach ernten' : 'einmal ernten'}</div></div><div class="rechts"><button class="knopf gruen klein" data-act="waehlen" data-key="${esc(key)}">Pflanzen</button></div></div>`;
  }
  return h;
}
function htmlAuftraege(now) {
  let h = `<div class="info">Das Dorf bestellt Ernte. Liefere aus dem Lager und bekomme mehr als beim Verkauf, dazu Ruf. Neue Bestellungen kommen von allein.</div>`;
  st.auftraege.forEach((a, i) => {
    const p = PLANTS[a.id], hab = Au.habe(st, a), ok = hab >= a.n;
    h += `<div class="karte">${pi(a.id, a.mut ? ['gold'] : [])}<div class="mitte"><div class="name">${a.n}× ${esc(p.name)}${a.mut ? ' <span class="mut">mit Mutation</span>' : ''}</div><div class="klein">Du hast ${hab} von ${a.n} · noch ${dauer(a.bis - now)}</div><div class="klein">Lohn ${fmt(a.lohn)} € + ${a.ruf} Ruf</div></div><div class="rechts"><button class="knopf ${ok ? 'gruen' : 'grau'} klein" data-act="liefern" data-i="${i}" ${ok ? '' : 'disabled'}>Liefern</button></div></div>`;
  });
  return h;
}
function htmlAufbruch(now) {
  let h = `<div class="info">Schick einen Wagen los. Er kommt mit Samen zurück, auch mit solchen, die der Markt (noch) nicht verkauft. Unterwegs passiert manchmal etwas. Wagen: ${st.reisen.length}/${Rz.slots(st)}.</div>`;
  st.reisen.forEach((r, i) => {
    const G = Rz.GEBIETE[r.gi], D = Rz.DAUER[r.di], fertig = Rz.reiseBereit(r, now), pr = Math.min(100, Math.round(100 * (now - r.start) / (r.ende - r.start)));
    h += `<div class="karte" style="flex-direction:column;align-items:stretch"><div class="zeile"><b>${G.name} (${D.name})</b><span>${fertig ? 'zurück!' : 'noch ' + dauer(r.ende - now)}</span></div><div class="balken"><i style="width:${pr}%;background:${G.farbe}"></i></div>${fertig ? `<button class="knopf gruen" data-act="reiseheim" data-i="${i}">Zurückkehren</button>` : ''}</div>`;
  });
  h += '<h3>Neue Reise</h3>';
  Rz.GEBIETE.forEach((G, gi) => {
    const offen = Rz.gebietOffen(st, gi);
    h += `<div class="karte" style="flex-direction:column;align-items:stretch;${offen ? '' : 'opacity:.55'}"><div class="zeile"><b style="color:${Art.shade(G.farbe, -0.35)}">${G.name}</b><span class="klein">${offen ? 'Funde bis ' + Rz.hoechsteSeltenheit(gi) : 'ab ' + G.ruf + ' Ruf'}</span></div><div class="klein">${G.text}</div>`;
    if (offen) h += `<div style="display:flex;gap:6px;margin-top:6px">${Rz.DAUER.map((D, di) => `<button class="knopf gold klein" style="flex:1" data-act="reise" data-g="${gi}" data-d="${di}" ${st.geld < Rz.reiseKosten(gi, di) ? 'disabled' : ''}>${D.name}<br>${dauer(D.ms)}<br>${fmt(Rz.reiseKosten(gi, di))} €</button>`).join('')}</div>`;
    h += '</div>';
  });
  return h;
}
function htmlEreignis() {
  const r = st.reisen[panelArg]; if (!r) return '<div class="leer">Keine Reise.</div>';
  const ev = Rz.EREIGNISSE[Rz.ereignisIndex(r)];
  return `<div class="karte" style="flex-direction:column;align-items:stretch"><div class="name">${ev.titel}</div><div class="info" style="font-size:15px">${ev.text}</div></div>
    <button class="knopf gruen" data-act="wahl" data-i="${panelArg}" data-w="a">${ev.a.label}</button><button class="knopf gold" data-act="wahl" data-i="${panelArg}" data-w="b">${ev.b.label}</button>
    <div class="info">Der zweite Weg ist oft riskanter, kann sich aber lohnen.</div>`;
}
function htmlErgebnis() {
  const r = ergebnis; if (!r) return '<div class="leer">Nichts.</div>';
  let h = `<div class="karte" style="flex-direction:column;align-items:stretch"><div class="info" style="font-size:15px">${r.text}</div>${r.geld ? `<div class="zeile"><span>Gefunden</span><span>+${fmt(r.geld)} €</span></div>` : ''}<div class="zeile"><span>Ruf</span><span>+${r.ruf}</span></div></div><h3>Mitgebrachte Samen</h3>`;
  for (const e of r.samen) h += `<div class="karte">${pi(e.id, e.muts)}<div class="mitte"><div class="name">${esc(PLANTS[e.id].name)} × ${e.n} ${badge(PLANTS[e.id].rar)}</div><div class="klein">${mutChips(e.muts) || 'ohne Mutation'}</div></div></div>`;
  return h + `<button class="knopf gruen" data-act="zu">Super</button>`;
}
function htmlOnline(now) {
  if (!st.online) return `<div class="info" style="font-size:15px">Besuche die Höfe anderer Spieler, hilf ihnen beim Gießen und tausche Pflanzen. Such dir dafür einen Spielernamen aus. Er ist für alle sichtbar.</div>
    <input class="feld" id="online-name" maxlength="16" placeholder="Dein Spielername" autocomplete="off"><button class="knopf gruen" data-act="anmelden">Anmelden</button>${onlineMeldung ? `<div class="info" style="color:#d8413a">${esc(onlineMeldung)}</div>` : ''}`;
  let h = `<div class="karte"><div class="mitte"><div class="name">${esc(st.online.name)}</div><div class="klein">Dein Hof ist für andere sichtbar.</div></div></div>
    <div class="reiter"><button class="${onlineReiter === 'besuch' ? 'an' : ''}" data-act="oreiter" data-r="besuch">Höfe besuchen</button><button class="${onlineReiter === 'tausch' ? 'an' : ''}" data-act="oreiter" data-r="tausch">Tauschbörse</button></div>`;
  if (onlineMeldung) h += `<div class="info" style="color:#d8413a">${esc(onlineMeldung)}</div>`;
  if (onlineReiter === 'besuch') {
    if (!hoefeListe) return h + '<div class="leer">Lade …</div>';
    const liste = hoefeListe.filter(x => x.name.toLowerCase() !== st.online.name.toLowerCase());
    if (!liste.length) return h + '<div class="leer">Noch kein anderer Hof online.</div>';
    for (const x of liste) h += `<div class="karte"><div class="mitte"><div class="name">${esc(x.name)}</div><div class="klein">Ruf ${x.ruf || 0} · ${x.felder || 0} Felder · ${vor(x.zuletzt)}</div></div><div class="rechts"><button class="knopf gruen klein" data-act="besuchen" data-name="${esc(x.name)}">Besuchen</button></div></div>`;
    return h;
  }
  // Tauschbörse
  const stapel = st.lager.map(e => `<option value="${esc(L.itemKey(e.id, e.muts))}">${esc(PLANTS[e.id].name)} × ${e.n}${e.muts.length ? ' (' + e.muts.map(m => MUT[m].name).join(', ') + ')' : ''}</option>`).join('');
  const alle = PLANT_IDS.filter(id => !HIDDEN.includes(PLANTS[id].rar) || st.entdeckt[id]).sort((a, b) => PLANTS[a].name.localeCompare(PLANTS[b].name, 'de')).map(id => `<option value="${id}">${esc(PLANTS[id].name)}</option>`).join('');
  h += `<h3>Neues Angebot</h3><div class="karte" style="flex-direction:column;align-items:stretch">${st.lager.length ? `
    <div class="info">Ich gebe</div><div class="zwei"><select class="feld" id="t-gib">${stapel}</select><input class="feld" id="t-gibn" type="number" min="1" value="1" style="max-width:78px"></div>
    <div class="info">Ich suche</div><div class="zwei"><select class="feld" id="t-will">${alle}</select><input class="feld" id="t-willn" type="number" min="1" value="1" style="max-width:78px"></div>
    <button class="knopf gold" data-act="tauschneu">Anbieten</button>` : '<div class="info">Du brauchst etwas in der Ernte, das du anbieten kannst.</div>'}</div><h3>Angebote</h3>`;
  if (!tauschListe) return h + '<div class="leer">Lade …</div>';
  if (!tauschListe.length) return h + '<div class="leer">Gerade gibt es keine Angebote.</div>';
  for (const a of tauschListe) {
    const kann = !a.meins && L.tauschAuswahl(st, a.will);
    h += `<div class="karte"><div class="mitte"><div class="name">${a.meins ? 'Dein Angebot' : esc(a.von)}</div><div class="klein">Gibt: ${esc(itemsText(a.gibt))}</div><div class="klein">Sucht: ${esc(itemsText(a.will))}</div></div><div class="rechts">${a.meins ? `<button class="knopf grau klein" data-act="tauschzurueck" data-id="${a.id}">Zurückziehen</button>` : `<button class="knopf ${kann ? 'gruen' : 'grau'} klein" data-act="tauschannehmen" data-id="${a.id}" ${kann ? '' : 'disabled'}>Tauschen</button>`}</div></div>`;
  }
  return h;
}
function htmlBesuchHof() {
  if (!besuchHof) return '<div class="leer">Lade …</div>';
  const o = besuchHof.hof;
  return `<div class="info">Ruf ${o.ruf} · ${o.entdeckt} Pflanzen entdeckt · ${vor(besuchHof.t)}. Tippe auf eine wachsende Pflanze, um sie zu gießen.</div><canvas id="besuchcv"></canvas><button class="knopf grau" data-act="obesuchzu">Zurück</button>`;
}
let besuchGeo = null;
function zeichneBesuch() {
  const c = document.getElementById('besuchcv'); if (!c || !besuchHof) return;
  const o = besuchHof.hof, W = Math.min(400, c.parentElement.clientWidth - 12), tsB = Math.floor(W / COLS), rowsB = Math.ceil(o.felder / COLS), d = Math.min(2, window.devicePixelRatio || 1);
  const w = tsB * COLS, h = tsB * rowsB + 6;
  if (c.width !== Math.round(w * d)) { c.width = Math.round(w * d); c.height = Math.round(h * d); c.style.width = w + 'px'; c.style.height = h + 'px'; }
  const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, w, h);
  const now = Date.now(), vergangen = now - besuchHof.t, season = L.seasonAt(now), tms = performance.now();
  besuchGeo = { ts: tsB, w, h };
  for (let i = 0; i < o.felder; i++) {
    const x = (i % COLS) * tsB, y = Math.floor(i / COLS) * tsB + 3;
    Art.drawTileBase(g, x, y, tsB, { boden: 80, wasser: 1, season, owned: true });
    const t = o.tiles[i]; if (!t) continue;
    const f = t.rest <= vergangen ? 1 : t.f + (1 - t.f) * (vergangen / t.rest);
    Art.drawPlant(g, { id: t.id, prog: f, total: 1, muts: t.m }, x + tsB / 2, y + tsB * 0.8, tsB * 0.92, tms, i * 7 + 3);
    if (f >= 1) Art.drawReadyMark(g, x, y, tsB, tms);
  }
}
function htmlBauen() {
  let h = '';
  if (st.felder < START.felderMax) { const pr = feldPreis(st.felder); h += `<div class="karte"><div class="mitte"><div class="name">Neues Feld</div><div class="klein">Du hast ${st.felder} von ${START.felderMax} Feldern.</div></div><div class="rechts"><button class="knopf gold klein" data-act="feld" ${st.geld < pr ? 'disabled' : ''}>${fmt(pr)} €</button></div></div>`; }
  else h += `<div class="karte"><div class="mitte"><div class="name">Alle Felder gekauft</div></div></div>`;
  for (const id of Object.keys(BUILDINGS)) {
    const b = BUILDINGS[id], s = st.gebaeude[id], kosten = L.gebaeudeStufeKosten(st, id);
    h += `<div class="karte"><div class="mitte"><div class="name">${b.name} <span class="klein">Stufe ${s}/${b.kosten.length}</span></div><div class="klein">${s ? 'Jetzt: ' + b.text[s - 1] : 'Noch nicht gebaut.'}</div>${kosten != null ? `<div class="klein">Nächste Stufe: ${b.text[s]}</div>` : ''}</div>
      <div class="rechts">${kosten != null ? `<button class="knopf gold klein" data-act="bauen" data-id="${id}" ${st.geld < kosten ? 'disabled' : ''}>${fmt(kosten)} €</button>` : '<span class="badge hell">Max</span>'}</div></div>`;
  }
  return h;
}
function htmlIndex() {
  const alle = PLANT_IDS.filter(id => !HIDDEN.includes(PLANTS[id].rar) || st.entdeckt[id]);
  const gefunden = alle.filter(id => st.entdeckt[id]).length;
  let h = `<div class="karte"><div class="mitte"><div class="name">${gefunden} von ${alle.length} entdeckt</div><div class="balken" style="margin-top:6px"><i style="width:${Math.round(100 * gefunden / alle.length)}%"></i></div></div></div>`;
  h += `<div class="reiter"><button class="${indexFilter === 'alle' ? 'an' : ''}" data-act="filter" data-f="alle">Alle</button><button class="${indexFilter === 'da' ? 'an' : ''}" data-act="filter" data-f="da">Entdeckt</button><button class="${indexFilter === 'fehlt' ? 'an' : ''}" data-act="filter" data-f="fehlt">Fehlt noch</button></div><div class="raster">`;
  const liste = alle.slice().sort((a, b) => RARITIES.indexOf(PLANTS[a].rar) - RARITIES.indexOf(PLANTS[b].rar));
  for (const id of liste) {
    const d = st.entdeckt[id]; if (indexFilter === 'da' && !d) continue; if (indexFilter === 'fehlt' && d) continue;
    const p = PLANTS[id], c = RARITY_COLOR[p.rar];
    h += `<div class="zelle ${d ? '' : 'unbekannt'}" data-act="pflanze" data-id="${id}"><canvas width="112" height="112" data-pi="${id}"></canvas>${d ? esc(p.name) : '???'}<div class="r" style="background:${c === 'rainbow' ? 'linear-gradient(90deg,#ff7a7a,#ffd84a,#6fd04a,#4aa8ff,#b06aff)' : c}"></div></div>`;
  }
  return h + '</div>';
}
function htmlPflanze(id) {
  const p = PLANTS[id], d = st.entdeckt[id];
  if (!d) return `<div class="gross"><canvas width="260" height="260" data-pi="${id}" style="filter:brightness(0) opacity(.35)"></canvas><div class="name">???</div>${badge(p.rar)}<div class="info">${HIDDEN.includes(p.rar) ? 'Diese Pflanze ist geheim.' : 'Pflanze sie einmal an, um sie zu entdecken.'}</div></div>`;
  return `<div class="gross"><canvas width="260" height="260" data-pi="${id}"></canvas>${badge(p.rar)}</div>
    <div class="karte" style="flex-direction:column;align-items:stretch">
      <div class="zeile"><span>Wachstum</span><span>${dauer(p.min * MIN)}</span></div>
      <div class="zeile"><span>Ernte</span><span>${p.typ === 'm' ? 'mehrfach (bis zu 4×)' : 'einmal'}</span></div>
      <div class="zeile"><span>Lieblings-Jahreszeit</span><span>${p.saison === 'a' ? 'keine' : SEASONS[SEASON_KEYS.indexOf(p.saison)]}</span></div>
      <div class="zeile"><span>Familie</span><span>${p.arche}</span></div>
      <div class="zeile"><span>Verkaufswert</span><span>${fmt(p.wert)} €</span></div>
      <div class="zeile"><span>Gepflanzt / geerntet</span><span>${d.p} / ${d.g}</span></div>
      <div class="zeile"><span>Bester Wert</span><span>× ${d.best.toFixed(2).replace('.', ',')}</span></div></div>`;
}
function htmlFeld(idx, now) {
  const t = st.tiles[idx]; if (!t) return '<div class="leer">Hier wächst nichts.</div>';
  const p = PLANTS[t.id], pr = Math.round(100 * t.prog / t.total), rest = L.restZeit(st, idx, now), tp = L.tempo(st, idx, now);
  return `<div class="karte">${pi(t.id, t.muts)}<div class="mitte"><div class="name">${esc(p.name)} ${badge(p.rar)}</div><div class="klein">${mutChips(t.muts) || 'keine Mutation'}</div></div></div>
    <div class="karte" style="flex-direction:column;align-items:stretch"><div class="zeile"><span>Reif in</span><span>${L.istReif(t) ? 'jetzt' : dauer(rest)}</span></div><div class="balken"><i style="width:${pr}%"></i></div>
    <div class="zeile"><span>Tempo</span><span>${Math.round(tp * 100)} %</span></div>
    <div class="zeile"><span>Wasser</span><span>${st.wasser[idx] > 0 ? 'ok' : 'durstig'}</span></div>
    <div class="zeile"><span>Erde</span><span>${Math.round(st.boden[idx])} %</span></div>
    ${t.mono ? '<div class="info">Hier stand schon dasselbe. Wechsle die Pflanzenfamilie, dann bleibt die Erde fruchtbar.</div>' : ''}
    ${t.ff ? '<div class="info">Fruchtfolge-Bonus: etwas mehr Ernte.</div>' : ''}</div>
    <div style="display:flex;gap:8px"><button class="knopf blau" data-act="giessen" data-i="${idx}">Gießen</button><button class="knopf rot" data-act="roden" data-i="${idx}">Roden (+${Math.floor(p.preis * L.kompostRueck(st))} €)</button></div>`;
}
function htmlRuf() {
  const rs = L.rufStufe(st), nr = L.naechsteRuf(st);
  let h = `<div class="karte"><div class="mitte"><div class="name">${rs.name} · ${st.ruf} Ruf</div><div class="klein">Schaltet Samen bis „${rs.bis}“ frei.</div>${nr ? `<div class="balken" style="margin-top:6px"><i style="width:${Math.round(100 * (st.ruf - rs.ab) / (nr.ab - rs.ab))}%"></i></div><div class="klein">Noch ${nr.ab - st.ruf} bis „${nr.name}“ (bis ${nr.bis})</div>` : '<div class="klein">Höchste Stufe erreicht.</div>'}</div></div>`;
  h += '<div class="info">Ruf bekommst du, wenn du etwas pflanzt.</div>';
  return h;
}
function htmlWillkommen() {
  return `<div class="karte" style="flex-direction:column;align-items:stretch;gap:8px"><div class="info" style="font-size:15px">Auf deinem Hof wachsen Pflanzen in echter Zeit. Sie wachsen auch weiter, wenn du nicht da bist.</div>
  <div class="zeile"><span>1.</span><span>Wähle im <b>Lager</b> Samen und tippe auf leere Felder.</span></div>
  <div class="zeile"><span>2.</span><span>Durstige Pflanzen (Tropfen) wachsen halb so schnell. Tippe zum <b>Gießen</b>. Regen gießt von allein.</span></div>
  <div class="zeile"><span>3.</span><span>Reife Pflanzen <b>ernten</b>, im Lager <b>verkaufen</b>, im <b>Markt</b> neue Samen kaufen.</span></div>
  <div class="zeile"><span>4.</span><span>Wechsle die Pflanzen auf einem Feld, sonst wird die Erde müde. Jede Pflanze mag eine Jahreszeit.</span></div></div>
  <div class="info">Du startest mit 3 Karotten- und 2 Salat-Samen.</div><button class="knopf gruen" data-act="zu">Los geht's!</button>`;
}

// ── Klicks in Panels und Leiste ────────────────────────
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-act],[data-panel]'); if (!el) return;
  if (el.dataset.panel) { if (panel === el.dataset.panel) closePanel(); else { if (el.dataset.panel === 'lager') lagerReiter = st.lager.length ? 'ernte' : 'samen'; openPanel(el.dataset.panel); } return; }
  const act = el.dataset.act, now = Date.now(), d = el.dataset;
  switch (act) {
    case 'zu': closePanel(); break;
    case 'einst': if (window.LGH) window.LGH.oeffnen(); break;
    case 'ruf': openPanel('ruf'); break;
    case 'abwaehlen': sel = null; kopfAktualisieren(); break;
    case 'kaufen': {
      const n = +d.n, r = L.samenKaufen(st, d.id, n, now);
      if (!r.ok) { meldung(r.grund, true); renderPanel(); break; }
      const pid = d.id === 'karotte-grund' ? 'karotte' : d.id;
      ton('kauf'); speichern(); renderPanel();
      meldung(`${n}× ${PLANTS[pid].name}-Samen gekauft · −${fmt(r.preis)} €`);
      const zeit = (e, k) => { if (!e) return; e.classList.remove(k); void e.offsetWidth; e.classList.add(k); };
      zeit(document.getElementById('p-geld'), 'zuckt');
      const knopf = blInhalt.querySelector(`[data-act="kaufen"][data-id="${d.id}"][data-n="${n}"]`) || blInhalt.querySelector(`[data-act="kaufen"][data-id="${d.id}"]`);
      const karte = knopf && knopf.closest('.karte'); zeit(karte, 'gekauft');
      if (karte) { const f = document.createElement('span'); f.className = 'flug'; f.textContent = '−' + fmt(r.preis) + ' €'; karte.appendChild(f); setTimeout(() => f.remove(), 1100); }
      break;
    }
    case 'reiter': lagerReiter = d.r; renderPanel(); break;
    case 'waehlen': sel = d.key; closePanel(); kopfAktualisieren(); break;
    case 'verkauf': { const s = L.verkaufen(st, d.key, +d.n, now); if (s) { ton('geld'); meldung(`+${fmt(s)} €`); speichern(); } renderPanel(); break; }
    case 'allesverkaufen': { const r = L.alleVerkaufen(st, now); if (r.n) { ton('geld'); meldung(`${r.n} verkauft: +${fmt(r.summe)} €`); speichern(); } renderPanel(); break; }
    case 'feld': { const r = L.feldKaufen(st); if (!r.ok) meldung(r.grund, true); else { ton('bauen'); meldung('Neues Feld!'); speichern(); } renderPanel(); break; }
    case 'bauen': { const r = L.gebaeudeBauen(st, d.id); if (!r.ok) meldung(r.grund, true); else { ton('bauen'); meldung(BUILDINGS[d.id].name + ' ausgebaut!'); speichern(); } renderPanel(); break; }
    case 'liefern': { const r = Au.liefern(st, +d.i, now); if (!r.ok) meldung(r.grund, true); else { ton('geld'); meldung(`+${fmt(r.lohn)} € und ${r.ruf} Ruf`); speichern(); } renderPanel(); break; }
    case 'reise': { const r = Rz.reiseStarten(st, +d.g, +d.d, now); if (!r.ok) meldung(r.grund, true); else { ton('bauen'); meldung('Der Wagen ist unterwegs!'); speichern(); } renderPanel(); break; }
    case 'reiseheim': panelArg = +d.i; panel = 'ereignis'; renderPanel(); break;
    case 'wahl': { const r = Rz.reiseAbschliessen(st, +d.i, d.w, now); if (!r.ok) { meldung(r.grund, true); break; } ergebnis = r; ton('ernte'); speichern(); panel = 'ergebnis'; renderPanel(); break; }
    case 'anmelden': { const el = document.getElementById('online-name'); const name = el ? el.value : ''; api('anmelden', { name }).then(r => { if (!r.ok) { onlineMeldung = r.grund; } else { st.online = { id: r.id, name: r.name, token: r.token }; onlineMeldung = ''; speichern(); onlineSync(true); ladeOnline(); } if (panel === 'online') renderPanel(); }); break; }
    case 'oreiter': onlineReiter = d.r; onlineMeldung = ''; renderPanel(); ladeOnline(); break;
    case 'besuchen': { besuchHof = null; panel = 'besuchhof'; renderPanel(); api('hof?name=' + encodeURIComponent(d.name)).then(r => { if (!r.ok) { meldung(r.grund, true); panel = 'online'; } else besuchHof = { name: r.name, hof: r.hof, t: r.t }; if (panel === 'besuchhof' || panel === 'online') renderPanel(); }); break; }
    case 'obesuchzu': panel = 'online'; renderPanel(); ladeOnline(); break;
    case 'tauschneu': { const gk = document.getElementById('t-gib').value, gn = Math.max(1, Math.floor(+document.getElementById('t-gibn').value || 1)), wid = document.getElementById('t-will').value, wn = Math.max(1, Math.floor(+document.getElementById('t-willn').value || 1));
      const e = st.lager.find(x => L.itemKey(x.id, x.muts) === gk); if (!e || e.n < gn) { meldung('So viel hast du nicht.', true); break; }
      const gibt = [{ id: e.id, muts: e.muts.slice(), n: gn }];
      if (!L.lagerEntnehmen(st, gibt)) { meldung('So viel hast du nicht.', true); break; }
      api('tausch/neu', { token: st.online.token, gibt, will: [{ id: wid, n: wn }] }).then(r => { if (!r.ok) { L.lagerHinzu(st, gibt); meldung(r.grund, true); } else { meldung('Angebot ist online.'); ton('bauen'); } speichern(); ladeOnline(); }); break; }
    case 'tauschannehmen': { const a = (tauschListe || []).find(x => x.id === +d.id); if (!a) break; const aus = L.tauschAuswahl(st, a.will); if (!aus) { meldung('Dir fehlt etwas dafür.', true); break; }
      L.lagerEntnehmen(st, aus);
      api('tausch/annehmen', { token: st.online.token, id: a.id, gibt: aus }).then(r => { if (!r.ok) { L.lagerHinzu(st, aus); meldung(r.grund, true); } else { L.lagerHinzu(st, r.bekommt); meldung('Getauscht: ' + itemsText(r.bekommt)); ton('geld'); } speichern(); ladeOnline(); }); break; }
    case 'tauschzurueck': api('tausch/zurueck', { token: st.online.token, id: +d.id }).then(r => { if (!r.ok) meldung(r.grund, true); else { L.lagerHinzu(st, r.gibt); meldung('Angebot zurückgezogen.'); } speichern(); ladeOnline(); }); break;
    case 'filter': indexFilter = d.f; renderPanel(); break;
    case 'pflanze': panelArg = d.id; panel = 'pflanze'; renderPanel(); break;
    case 'giessen': L.giessen(st, +d.i); ton('giessen'); closePanel(); break;
    case 'roden': { const r = L.roden(st, +d.i); if (r.ok) { meldung(`Gerodet (+${r.rueck} €)`); speichern(); } closePanel(); break; }
    case 'alleernten': { const r = L.alleErnten(st); if (r.ernten.length) { ton('ernte'); const n = r.ernten.reduce((a, e) => a + e.menge, 0); meldung(`${n} geerntet${r.voll ? '. Das Lager ist voll!' : ''}`, r.voll); speichern(); } else meldung(r.voll ? 'Das Lager ist voll!' : 'Nichts ist reif.', r.voll); break; }
    case 'allegiessen': { const n = L.alleGiessen(st); if (n) { ton('giessen'); meldung(`${n} Felder gegossen`); } else meldung('Alles ist feucht.'); break; }
  }
});
bl.addEventListener('click', ev => { if (ev.target === bl) closePanel(); });
document.addEventListener('click', ev => {
  const c = ev.target; if (!c || c.id !== 'besuchcv' || !besuchHof || !besuchGeo) return;
  const r = c.getBoundingClientRect(), x = (ev.clientX - r.left) * (besuchGeo.w / r.width), y = (ev.clientY - r.top - 3) * (besuchGeo.h / r.height);
  const idx = Math.floor(y / besuchGeo.ts) * COLS + Math.floor(x / besuchGeo.ts); const t = besuchHof.hof.tiles[idx]; if (!t) return;
  api('helfen', { token: st.online.token, name: besuchHof.name, idx }).then(r2 => { if (!r2.ok) meldung(r2.grund, true); else { ton('giessen'); st.ruf += 1; speichern(); meldung('Gegossen! +1 Ruf für deine Hilfe.'); } });
});

// ── Start ──────────────────────────────────────────────
layout();
window.addEventListener('resize', layout);
const away = Date.now() - st.lastTick;
logikTick();
const reifJetzt = st.tiles.slice(0, st.felder).filter(t => L.istReif(t)).length;
if (!neu && away > 2 * MIN && reifJetzt) setTimeout(() => meldung(`Willkommen zurück! ${reifJetzt} ${reifJetzt === 1 ? 'Pflanze ist' : 'Pflanzen sind'} reif.`), 400);
setInterval(logikTick, 1000);
setInterval(speichern, 5000);
document.addEventListener('visibilitychange', () => { if (document.hidden) speichern(); else logikTick(); });
window.addEventListener('pagehide', speichern);
requestAnimationFrame(frame);
if (st.online) { onlineSync(true); }
if (!st.eingefuehrt) { st.eingefuehrt = true; setTimeout(() => openPanel('willkommen'), 300); }
speichern();
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__EZ = { st: () => st, L, Art, open: openPanel, tipp: tippFeld, wahl: k => { sel = k; } };
