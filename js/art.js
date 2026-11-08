// Gezeichnete Grafik (Canvas). Alles im Code, keine Bilddateien, keine Emojis.
import { PLANTS, MUT } from './data.js';

const OUT = '#2b2418';
const TAU = Math.PI * 2;

export function shade(hex, amt) {
  if (!hex || hex[0] !== '#') return hex;
  let n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((f - r) * p + r); g = Math.round((f - g) * p + g); b = Math.round((f - b) * p + b);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
export function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round((pa >> 16) * (1 - t) + (pb >> 16) * t), g = Math.round(((pa >> 8) & 255) * (1 - t) + ((pb >> 8) & 255) * t), bl = Math.round((pa & 255) * (1 - t) + (pb & 255) * t);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1);
}
const rainbow = (i, tms = 0) => `hsl(${(i * 55 + tms / 25) % 360},85%,62%)`;
const col = (c, i = 0, tms = 0) => c === 'rainbow' ? rainbow(i, tms) : c;

// Licht von oben: Verlauf wird einmal gebaut und für alle Formen wiederverwendet
let GRAD = null;
function lichtVerlauf() {
  if (GRAD) return GRAD;
  const c = (typeof document !== 'undefined') ? document.createElement('canvas').getContext('2d') : null; if (!c) return null;
  GRAD = c.createLinearGradient(0, -80, 0, 4);
  GRAD.addColorStop(0, 'rgba(255,255,255,.30)'); GRAD.addColorStop(0.5, 'rgba(255,255,255,0)'); GRAD.addColorStop(1, 'rgba(10,0,40,.24)');
  return GRAD;
}
function fs(ctx, fill, lw = 2, flach = false) {
  ctx.fillStyle = fill; ctx.fill();
  if (!flach && typeof fill === 'string' && fill[0] === '#') { const g = lichtVerlauf(); if (g) { ctx.save(); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(-140, -150, 280, 170); ctx.restore(); } }
  if (lw) { ctx.lineWidth = lw; ctx.stroke(); }
}
function gloss(ctx, x, y, r, a = 0.6) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,' + a + ')'; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.3, r), Math.max(0.3, r * 0.6), -0.6, 0, TAU); ctx.fill(); ctx.restore(); }
function dots(ctx, pts, r, fill) { ctx.fillStyle = fill; for (const [x, y] of pts) { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); } }
function ell(ctx, x, y, rx, ry, fill, rot = 0, lw = 2) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); fs(ctx, fill, lw); }
function circ(ctx, x, y, r, fill, lw = 2) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); fs(ctx, fill, lw); }
function leaf(ctx, x, y, ang, len, wid, fill, vein) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  if (vein === undefined && typeof fill === 'string' && fill[0] === '#') vein = shade(fill, -0.28);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -wid, len, 0); ctx.quadraticCurveTo(len * 0.5, wid, 0, 0); fs(ctx, fill, 1.8);
  if (vein) {
    ctx.strokeStyle = vein; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(len * 0.08, 0); ctx.lineTo(len * 0.88, 0);
    if (len > 14) for (const t of [0.3, 0.52, 0.72]) { const w = wid * 0.5 * (1 - Math.abs(t - 0.45)); ctx.moveTo(len * t, 0); ctx.lineTo(len * (t + 0.13), -w); ctx.moveTo(len * t, 0); ctx.lineTo(len * (t + 0.13), w); }
    ctx.stroke(); ctx.strokeStyle = OUT;
  }
  ctx.restore();
}
function stem(ctx, x0, y0, x1, y1, cx, cy, c, w = 4) {
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1);
  ctx.lineWidth = w + 3; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke();
  ctx.lineWidth = w; ctx.strokeStyle = c; ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
}
function star(ctx, x, y, r, fill) {
  ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r * 0.35 : r; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}


// Eine einzelne Frucht/Beere je Sorte (x,y = Mitte, r = Größe)
function frucht(ctx, id, x, y, r, c) {
  const st = ctx.strokeStyle;
  const stiel = (dx = 0, dy = -r, c2 = '#5a7a2e') => { ctx.beginPath(); ctx.moveTo(x, y + dy * 0.7); ctx.lineTo(x + dx, y + dy - 3); ctx.lineWidth = 2; ctx.strokeStyle = c2; ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 1.6; };
  const kelch = (cc = '#4f9a3a') => { for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.7; leaf(ctx, x, y - r * 0.75, a, r * 0.8, r * 0.3, cc, null); } };
  ctx.lineWidth = 1.6;
  switch (id) {
    case 'tomate': circ(ctx, x, y, r * 1.1, c, 1.6); kelch(); gloss(ctx, x - r * 0.4, y - r * 0.3, r * 0.35); break;
    case 'paprika': ell(ctx, x, y, r * 0.95, r * 1.25, c, 0, 1.6); stiel(0, -r * 1.2, '#4f8a3a'); gloss(ctx, x - r * 0.35, y - r * 0.3, r * 0.3); break;
    case 'erdbeere': { ctx.beginPath(); ctx.moveTo(x - r, y - r * 0.5); ctx.quadraticCurveTo(x, y - r * 1.2, x + r, y - r * 0.5); ctx.quadraticCurveTo(x + r * 0.7, y + r * 0.8, x, y + r * 1.2); ctx.quadraticCurveTo(x - r * 0.7, y + r * 0.8, x - r, y - r * 0.5); fs(ctx, c, 1.6); dots(ctx, [[-0.4, -0.2], [0.35, -0.3], [0, 0.2], [-0.25, 0.55], [0.3, 0.45]].map(([a, b]) => [x + a * r, y + b * r]), r * 0.13, '#ffe27a'); kelch(); break; }
    case 'blaubeere': case 'aubergine': case 'himmelstraube': circ(ctx, x, y, r, c, 1.5); ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; ctx.lineTo(x + Math.cos(a) * r * 0.35, y - r * 0.55 + Math.sin(a) * r * 0.25); } ctx.closePath(); ctx.fillStyle = shade(c, -0.4); ctx.fill(); gloss(ctx, x - r * 0.4, y - r * 0.2, r * 0.3, 0.45); break;
    case 'apfel': circ(ctx, x, y, r * 1.05, c, 1.6); ctx.beginPath(); ctx.arc(x, y - r * 0.9, r * 0.28, 0, Math.PI); ctx.fillStyle = shade(c, -0.35); ctx.fill(); stiel(1, -r * 1.1, '#6a4a2a'); leaf(ctx, x + 1, y - r * 1.1, -0.5, r * 0.9, r * 0.35, '#5aa845'); gloss(ctx, x - r * 0.45, y - r * 0.25, r * 0.32); break;
    case 'birne': { ctx.beginPath(); ctx.moveTo(x, y - r * 1.3); ctx.bezierCurveTo(x + r * 0.5, y - r * 1.1, x + r * 0.5, y - r * 0.2, x + r * 1.0, y + r * 0.4); ctx.bezierCurveTo(x + r * 1.0, y + r * 1.2, x - r * 1.0, y + r * 1.2, x - r * 1.0, y + r * 0.4); ctx.bezierCurveTo(x - r * 0.5, y - r * 0.2, x - r * 0.5, y - r * 1.1, x, y - r * 1.3); fs(ctx, c, 1.6); stiel(1, -r * 1.3, '#6a4a2a'); gloss(ctx, x - r * 0.45, y + r * 0.2, r * 0.3); break; }
    case 'zitrone': { ctx.beginPath(); ctx.moveTo(x - r * 1.35, y); ctx.quadraticCurveTo(x - r * 1.0, y - r * 1.0, x, y - r * 1.0); ctx.quadraticCurveTo(x + r * 1.0, y - r * 1.0, x + r * 1.35, y); ctx.quadraticCurveTo(x + r * 1.0, y + r * 1.0, x, y + r * 1.0); ctx.quadraticCurveTo(x - r * 1.0, y + r * 1.0, x - r * 1.35, y); fs(ctx, c, 1.6); gloss(ctx, x - r * 0.3, y - r * 0.35, r * 0.35); break; }
    case 'orange': circ(ctx, x, y, r * 1.1, c, 1.6); dots(ctx, [[-0.4, -0.2], [0.3, 0.3], [0.1, -0.5], [-0.2, 0.5], [0.5, -0.15]].map(([a, b]) => [x + a * r, y + b * r]), 0.7, shade(c, -0.3)); circ(ctx, x, y - r * 0.95, 1.8, '#4f9a3a', 1); gloss(ctx, x - r * 0.4, y - r * 0.3, r * 0.3); break;
    case 'kirsche': { ctx.beginPath(); ctx.moveTo(x - r * 0.9, y + r * 0.2); ctx.quadraticCurveTo(x - r * 0.3, y - r * 1.6, x, y - r * 1.9); ctx.moveTo(x + r * 0.9, y + r * 0.2); ctx.quadraticCurveTo(x + r * 0.3, y - r * 1.6, x, y - r * 1.9); ctx.lineWidth = 1.6; ctx.strokeStyle = '#5a7a2e'; ctx.stroke(); ctx.strokeStyle = OUT; circ(ctx, x - r * 0.9, y + r * 0.4, r * 0.8, c, 1.5); circ(ctx, x + r * 0.9, y + r * 0.4, r * 0.8, shade(c, -0.1), 1.5); gloss(ctx, x - r * 1.15, y + r * 0.15, r * 0.25); gloss(ctx, x + r * 0.65, y + r * 0.15, r * 0.25); break; }
    case 'olive': ell(ctx, x, y, r * 0.7, r * 1.0, c, 0.3, 1.5); gloss(ctx, x - r * 0.15, y - r * 0.3, r * 0.2, 0.4); break;
    case 'avocado': { ctx.beginPath(); ctx.moveTo(x, y - r * 1.25); ctx.bezierCurveTo(x + r * 0.55, y - r * 1.1, x + r * 0.45, y - r * 0.2, x + r * 0.95, y + r * 0.4); ctx.bezierCurveTo(x + r * 0.95, y + r * 1.15, x - r * 0.95, y + r * 1.15, x - r * 0.95, y + r * 0.4); ctx.bezierCurveTo(x - r * 0.45, y - r * 0.2, x - r * 0.55, y - r * 1.1, x, y - r * 1.25); fs(ctx, c, 1.6); gloss(ctx, x - r * 0.4, y + r * 0.1, r * 0.3, 0.35); break; }
    case 'pfirsich': circ(ctx, x, y, r * 1.05, c, 1.6); ctx.beginPath(); ctx.moveTo(x, y - r * 0.9); ctx.quadraticCurveTo(x + r * 0.5, y, x, y + r * 0.9); ctx.lineWidth = 1.2; ctx.strokeStyle = shade(c, -0.35); ctx.stroke(); ctx.strokeStyle = OUT; leaf(ctx, x, y - r, -0.6, r * 0.9, r * 0.32, '#5aa845'); gloss(ctx, x - r * 0.5, y - r * 0.2, r * 0.3, 0.5); break;
    case 'mango': ell(ctx, x, y, r * 0.85, r * 1.2, c, 0.6, 1.6); gloss(ctx, x - r * 0.3, y - r * 0.4, r * 0.3, 0.5); break;
    case 'kastanie': circ(ctx, x, y, r * 0.9, shade(c, 0.1), 1.6); for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8); ctx.lineTo(x + Math.cos(a) * r * 1.25, y + Math.sin(a) * r * 1.25); ctx.lineWidth = 1.5; ctx.stroke(); } break;
    default: circ(ctx, x, y, r, c, 1.6); gloss(ctx, x - r * 0.35, y - r * 0.3, r * 0.3, 0.5);
  }
  ctx.strokeStyle = st; ctx.lineWidth = 2;
}

// ── Archetypen. Koordinaten: Ursprung = Fuß der Pflanze, nach oben negativ, Höhe ca. 90 ──
// k = Wuchs (0.3–1), fr = Reife der Frucht (0–1), sw = Schwanken, r = Zufall (0–1) je Feld
const A = {
  wurzel(ctx, p, k, fr, sw, r) {
    const id = p.id, n = 6;
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.4 + sw; leaf(ctx, 0, -6, a, (36 + (i % 2) * 9) * k, 6.5 * k, shade(p.c2, i % 2 ? -0.1 : 0.06)); }
    if (fr > 0) {
      const s = 0.4 + 0.6 * fr;
      if (id === 'karotte') {
        ctx.beginPath(); ctx.moveTo(-10 * s, -9); ctx.quadraticCurveTo(0, -19 * s, 10 * s, -9); ctx.lineTo(1.5, 10 * s); ctx.lineTo(-1.5, 10 * s); ctx.closePath(); fs(ctx, p.c1);
        ctx.beginPath(); for (const [y, w] of [[-4, 6], [1, 4], [6, 2.5]]) { ctx.moveTo(-w * s, y * s); ctx.lineTo(-w * s * 0.2, (y + 1.5) * s); } ctx.lineWidth = 1.2; ctx.strokeStyle = shade(p.c1, -0.3); ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      } else if (id === 'ingwer') { ell(ctx, -6, -6, 11 * s, 6 * s, p.c1, -0.3); ell(ctx, 7, -8, 9 * s, 5 * s, shade(p.c1, 0.1), 0.4); ell(ctx, 0, -3, 8 * s, 4 * s, shade(p.c1, -0.06), 0.1); }
      else if (id === 'kartoffel') { ctx.beginPath(); ctx.ellipse(0, -4, 14 * s, 10 * s, -0.15, 0, TAU); fs(ctx, p.c1); dots(ctx, [[-5, -6], [4, -2], [-2, 1], [7, -7]].map(([x, y]) => [x * s, y * s]), 1.1 * s + 0.3, shade(p.c1, -0.4)); gloss(ctx, -5 * s, -8 * s, 3 * s, 0.4); }
      else if (id === 'ruebe') {
        ctx.beginPath(); ctx.moveTo(-2, 9 * s); ctx.lineTo(0, 16 * s); ctx.lineTo(2, 9 * s); ctx.lineWidth = 2; ctx.stroke();
        ell(ctx, 0, -5, 13 * s, 11 * s, '#f0e6d8'); ctx.save(); ctx.beginPath(); ctx.ellipse(0, -5, 13 * s, 11 * s, 0, 0, TAU); ctx.clip(); ctx.fillStyle = p.c1; ctx.fillRect(-16 * s, -18 * s, 32 * s, 10 * s); ctx.restore(); ell(ctx, 0, -5, 13 * s, 11 * s, 'rgba(0,0,0,0)'); gloss(ctx, -5 * s, -10 * s, 3 * s);
      }
      else if (id === 'zwiebel' || id === 'knoblauch') {
        ctx.beginPath(); ctx.moveTo(0, -20 * s); ctx.quadraticCurveTo(-3 * s, -14 * s, -13 * s, -6); ctx.quadraticCurveTo(-13 * s, 6 * s, 0, 6 * s); ctx.quadraticCurveTo(13 * s, 6 * s, 13 * s, -6); ctx.quadraticCurveTo(3 * s, -14 * s, 0, -20 * s); fs(ctx, p.c1);
        ctx.beginPath(); for (const x of [-7, -2.5, 2.5, 7]) { ctx.moveTo(x * s * 0.5, -14 * s); ctx.quadraticCurveTo(x * s * 1.4, -4, x * s * 0.9, 5 * s); } ctx.lineWidth = 1.1; ctx.strokeStyle = shade(p.c1, -0.3); ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-2, 6 * s); ctx.lineTo(-3, 10 * s); ctx.moveTo(0, 6 * s); ctx.lineTo(0, 11 * s); ctx.moveTo(2, 6 * s); ctx.lineTo(3, 10 * s); ctx.lineWidth = 1; ctx.stroke(); ctx.lineWidth = 2;
      }
      else if (id === 'suesskartoffel') { ctx.beginPath(); ctx.ellipse(1, -5, 16 * s, 8 * s, -0.25, 0, TAU); fs(ctx, p.c1); gloss(ctx, -6 * s, -9 * s, 3 * s, 0.4); dots(ctx, [[4, -3], [9, -6]].map(([x, y]) => [x * s, y * s]), 1, shade(p.c1, -0.4)); }
      else {
        ell(ctx, 0, -4, 13 * s, 10 * s, p.c1); gloss(ctx, -5 * s, -9 * s, 3 * s);
        if (id === 'mandragora') { circ(ctx, -4, -5, 1.6, OUT, 0); circ(ctx, 4, -5, 1.6, OUT, 0); ctx.beginPath(); ctx.arc(0, -1, 3, 0.2, Math.PI - 0.2); ctx.lineWidth = 1.5; ctx.stroke(); ctx.beginPath(); ctx.moveTo(-6, 5); ctx.quadraticCurveTo(-10, 10, -6, 13); ctx.moveTo(6, 5); ctx.quadraticCurveTo(10, 10, 6, 13); ctx.stroke(); }
        if (id === 'aetherwurzel') { circ(ctx, 0, -4, 6 * s, 'rgba(255,255,255,.5)', 0); }
      }
    }
  },
  blatt(ctx, p, k, fr, sw, r) {
    if (p.id === 'brokkoli') {
      stem(ctx, 0, 0, 0, -26 * k, 0, -14 * k, '#8ab85a', 7);
      for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; circ(ctx, Math.cos(a) * 12 * k * (0.5 + fr * 0.5), -30 * k + Math.sin(a) * 8 * k, 10 * k * (0.6 + 0.4 * fr), p.c1); }
      circ(ctx, 0, -30 * k, 11 * k, shade(p.c1, 0.08)); for (let i = 0; i < 4; i++) leaf(ctx, 0, -4, -Math.PI / 2 + (i - 1.5) * 0.9, 30 * k, 8, p.c2);
      return;
    }
    const n = 7, alpha = p.id === 'geisterkraut' ? 0.8 : 1;
    ctx.globalAlpha = alpha;
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - 3) * 0.5 + sw; leaf(ctx, 0, -4, a, (30 + (i % 2) * 8) * k, 10 * k, col(p.c1, i), shade(p.c2, 0)); }
    ctx.globalAlpha = 1;
    if (fr > 0.5 && (p.id === 'glanzkraut' || p.id === 'schattenblatt' || p.id === 'geisterkraut')) { star(ctx, -12, -34 * k, 5, p.id === 'schattenblatt' ? '#d8b0ff' : '#fff6b0'); star(ctx, 14, -26 * k, 4, '#ffffff'); }
  },
  ranke(ctx, p, k, fr, sw, r) {
    const id = p.id;
    stem(ctx, -36 * k, -6, 0, -8, -16 * k, -24 * k, p.c2, 3);
    stem(ctx, 0, -8, 36 * k, -6, 18 * k, -22 * k, p.c2, 3);
    ctx.beginPath(); ctx.arc(-30 * k, -16 * k, 5, 0.5, 4.8); ctx.moveTo(30 * k + 5, -14 * k); ctx.arc(30 * k, -14 * k, 5, 3.6, 8.6); ctx.lineWidth = 1.4; ctx.strokeStyle = p.c2; ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    for (const [x, y, a, l] of [[-20, -14, -2.5, 20], [22, -14, -0.7, 20], [0, -10, -Math.PI / 2, 24], [-8, -12, -2.0, 16], [10, -12, -1.1, 16]]) leaf(ctx, x * k, y, a, l * k, 9 * k, shade(p.c2, 0.04));
    if (fr > 0) {
      const s = 0.35 + 0.65 * fr;
      if (id === 'gurke') { ell(ctx, 0, -9, 21 * s, 6.5 * s, p.c1, 0.12); dots(ctx, [[-10, -11], [-3, -7], [4, -11], [11, -8]].map(([x, y]) => [x * s, y * s - 1]), 0.9, shade(p.c1, -0.4)); gloss(ctx, -8 * s, -12 * s, 5 * s, 0.4); }
      else if (id === 'bohnen' || id === 'erbsenschote') {
        for (const [dx, rot] of id === 'bohnen' ? [[-12, 0.5], [0, 0.1], [12, -0.4]] : [[-6, 0.15], [8, -0.1]]) {
          ctx.save(); ctx.translate(dx * s, -9 - Math.abs(dx) * 0.2); ctx.rotate(rot); ell(ctx, 0, 0, 15 * s, 4.6 * s, p.c1, 0, 1.6);
          if (id === 'erbsenschote') dots(ctx, [[-8, 0], [-3, 0], [2, 0], [7, 0]].map(([x, y]) => [x * s, y]), 2 * s, shade(p.c1, 0.2)); gloss(ctx, -5 * s, -2 * s, 4 * s, 0.4); ctx.restore();
        }
      }
      else if (id === 'wassermelone') { ell(ctx, 0, -14 * s, 25 * s, 16 * s, p.c1); ctx.save(); ctx.beginPath(); ctx.ellipse(0, -14 * s, 25 * s, 16 * s, 0, 0, TAU); ctx.clip(); ctx.strokeStyle = shade(p.c1, -0.4); ctx.lineWidth = 3.2 * s; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 9 * s, -32 * s); ctx.quadraticCurveTo(i * 12 * s, -14 * s, i * 9 * s, 4); ctx.stroke(); } ctx.restore(); ctx.strokeStyle = OUT; ell(ctx, 0, -14 * s, 25 * s, 16 * s, 'rgba(0,0,0,0)'); gloss(ctx, -10 * s, -22 * s, 6 * s, 0.4); stem(ctx, 0, -29 * s, 2, -34 * s, 0, -32 * s, '#6a8a3a', 3); }
      else if (id === 'melone') { ell(ctx, 0, -14 * s, 21 * s, 17 * s, p.c1); ctx.save(); ctx.beginPath(); ctx.ellipse(0, -14 * s, 21 * s, 17 * s, 0, 0, TAU); ctx.clip(); ctx.strokeStyle = shade(p.c1, -0.25); ctx.lineWidth = 1; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 7 * s, -32 * s); ctx.lineTo(i * 7 * s + 6 * s, 4); ctx.moveTo(i * 7 * s + 12 * s, -32 * s); ctx.lineTo(i * 7 * s - 4 * s, 4); ctx.stroke(); } ctx.restore(); ctx.strokeStyle = OUT; ell(ctx, 0, -14 * s, 21 * s, 17 * s, 'rgba(0,0,0,0)'); gloss(ctx, -8 * s, -22 * s, 5 * s, 0.4); stem(ctx, 0, -30 * s, 2, -35 * s, 0, -33 * s, '#6a8a3a', 3); }
      else if (id === 'kuerbis' || id === 'sternenkuerbis') {
        ell(ctx, -10 * s, -13 * s, 11 * s, 14 * s, shade(p.c1, -0.12)); ell(ctx, 10 * s, -13 * s, 11 * s, 14 * s, shade(p.c1, -0.12)); ell(ctx, 0, -14 * s, 13 * s, 16 * s, p.c1);
        ctx.beginPath(); for (const x of [-6, 0, 6]) { ctx.moveTo(x * s, -29 * s); ctx.quadraticCurveTo(x * s * 1.4, -14 * s, x * s, 1); } ctx.lineWidth = 1.2; ctx.strokeStyle = shade(p.c1, -0.3); ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
        stem(ctx, 0, -28 * s, 3, -35 * s, 0, -32 * s, '#6a8a3a', 4); gloss(ctx, -6 * s, -22 * s, 4 * s, 0.4);
        if (id === 'sternenkuerbis') star(ctx, 0, -14 * s, 9 * s, '#fff2a0');
      }
      else { ell(ctx, 0, -13 * s, 19 * s, 14 * s, p.c1); gloss(ctx, -7 * s, -19 * s, 6 * s, 0.5); }
    }
  },
  busch(ctx, p, k, fr, sw, r) {
    const g = p.c2, id = p.id;
    for (const [x, y, rr, sh] of [[-18, -14, 13, -0.14], [18, -14, 13, -0.14], [-9, -22, 15, -0.06], [10, -24, 15, -0.06], [0, -31, 16, 0.04]]) circ(ctx, x * k, y * k, rr * k, shade(g, sh), 1.8);
    for (let i = 0; i < 7; i++) leaf(ctx, (i - 3) * 8 * k, -18 * k - (i % 3) * 7 * k, -Math.PI / 2 + (i - 3) * 0.55, 13 * k, 4, shade(g, 0.12));
    if (id === 'erdbeere' && fr < 0.6) for (let i = 0; i < 3; i++) { const fx = (i - 1) * 14 * k, fy = -30 * k - (i % 2) * 6; for (let j = 0; j < 5; j++) leaf(ctx, fx, fy, j / 5 * TAU, 5, 2.4, '#fffdf0', null); circ(ctx, fx, fy, 1.8, '#f2c43a', 0.8); }
    if (fr > 0) {
      const pts = [[-16, -16], [8, -20], [-4, -32], [18, -10], [-22, -8], [4, -8], [-10, -24], [14, -30], [-2, -18]];
      const n = Math.ceil(pts.length * fr), big = id === 'himmelstraube';
      const rr = ({ tomate: 6.4, paprika: 5.6, erdbeere: 5.2, blaubeere: 4.4, aubergine: 5.2, himmelstraube: 3.2 })[id] || 5;
      for (let i = 0; i < n; i++) {
        const [x, y] = pts[i], gr = rr * (0.5 + 0.5 * fr);
        if (big) { for (const [dx, dy] of [[-3, -2], [3, -2], [0, 3]]) frucht(ctx, id, x * k + dx, y * k + dy, gr, p.c1); }
        else frucht(ctx, id, x * k, y * k, gr, p.c1);
      }
    }
  },
  baum(ctx, p, k, fr, sw, r) {
    const big = p.id === 'weltbaum', K = big ? 1.15 : 1, tr = big ? '#8a6a3a' : '#7a5230';
    if (p.id === 'kokosnuss') {
      stem(ctx, 0, 0, 4 * sw * 30, -52 * k, -6, -26 * k, tr, 7);
      const tx = 4 * sw * 30, ty = -52 * k;
      for (let j = 1; j < 5; j++) { const t = j / 5; ctx.beginPath(); ctx.moveTo(-4 + tx * t * t, -52 * k * t - 2); ctx.lineTo(4 + tx * t * t, -52 * k * t - 2); ctx.lineWidth = 1.2; ctx.strokeStyle = shade(tr, -0.35); ctx.stroke(); }
      ctx.strokeStyle = OUT;
      for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.55; leaf(ctx, tx, ty, a, (36 + (i % 2) * 6) * k, 6, shade(p.c2, i % 2 ? 0 : 0.1)); }
      if (fr > 0) { circ(ctx, tx - 5, ty + 6, 5 * fr + 1.5, p.c1); circ(ctx, tx + 5, ty + 7, 5 * fr + 1.5, p.c1); circ(ctx, tx, ty + 9, 5 * fr + 1.5, shade(p.c1, 0.1)); }
      return;
    }
    const th = 32 * k * K, cy = -44 * k * K;
    // Stamm mit Ästen und Rinde
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.quadraticCurveTo(-5, -th * 0.5, -4, -th); ctx.lineTo(4, -th); ctx.quadraticCurveTo(5, -th * 0.5, 8, 0); ctx.closePath(); fs(ctx, tr);
    stem(ctx, 0, -th * 0.7, -15 * k, cy + 6, -6, -th * 0.9, tr, 4); stem(ctx, 0, -th * 0.65, 15 * k, cy + 8, 6, -th * 0.85, tr, 4);
    ctx.beginPath(); for (const [a, b] of [[-3, -6], [2, -14], [-2, -22], [3, -26]]) { ctx.moveTo(a - 1.5, b); ctx.lineTo(a + 1.5, b - 4); } ctx.lineWidth = 1.2; ctx.strokeStyle = shade(tr, -0.4); ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    if (big) { const gl = ctx.createRadialGradient(0, cy, 4, 0, cy, 56 * k); gl.addColorStop(0, 'rgba(255,230,120,.55)'); gl.addColorStop(1, 'rgba(255,230,120,0)'); ctx.fillStyle = gl; ctx.fillRect(-70, cy - 70, 140, 140); }
    const kr = k * K;
    // Krone aus mehreren Lappen, hinten dunkel, vorn hell
    for (const [x, y, rr, sh] of [[-22, 8, 14, -0.18], [22, 8, 14, -0.18], [-14, -2, 17, -0.1], [15, -1, 17, -0.1], [0, -12, 20, 0], [-8, 12, 13, -0.12], [10, 13, 13, -0.12]]) circ(ctx, x * kr, cy + y * k, rr * kr, shade(p.c2, sh), 1.8);
    for (const [x, y, rr] of [[-6, -14, 7], [8, -4, 6], [-14, 2, 5]]) { ctx.save(); ctx.globalAlpha = 0.22; circ(ctx, x * kr, cy + y * k, rr * kr, shade(p.c2, 0.55), 0); ctx.restore(); }
    if (fr > 0) {
      const pts = [[-18, 8], [12, 12], [-2, -10], [20, -2], [-22, -6], [4, 20], [-10, -20], [14, -18], [-12, 22]], n = Math.ceil(pts.length * fr);
      const rr = ({ apfel: 5.2, birne: 4.6, zitrone: 4.4, orange: 5.4, kirsche: 3.4, olive: 3.4, avocado: 4.4, pfirsich: 5.2, mango: 4.8, kastanie: 4.6 })[p.id] || 5;
      for (let i = 0; i < n; i++) { const [x, y] = pts[i]; frucht(ctx, p.id, x * kr, cy + y * k, rr * (0.55 + 0.45 * fr) * (big ? 1.1 : 1), p.c1); }
    }
  },
  blume(ctx, p, k, fr, sw, r) {
    const h = 46 * k, hx = sw * 30, id = p.id, c1 = p.c1;
    stem(ctx, 0, 0, hx, -h, 0, -h * 0.5, '#4f9a3a', 4);
    leaf(ctx, 0, -h * 0.3, -0.35, 24 * k, 7.5 * k, '#5aa845'); leaf(ctx, 0, -h * 0.22, -2.8, 24 * k, 7.5 * k, '#4f9a3a'); leaf(ctx, 0, -h * 0.5, -1.0, 15 * k, 5, '#6ab855');
    if (fr <= 0.2) { ell(ctx, hx, -h - 5, 6 * k + 2, 9 * k + 2, col(c1), 0); leaf(ctx, hx, -h - 8, -2.2, 8, 3, '#4f9a3a'); leaf(ctx, hx, -h - 8, -0.9, 8, 3, '#4f9a3a'); return; }
    const s = 0.4 + 0.6 * fr;
    if (id === 'lavendel') { for (let i = 0; i < 4; i++) { const bx = hx + (i - 1.5) * 7; stem(ctx, hx, -h * 0.55, bx, -h - 12, hx, -h * 0.8, '#6fa55a', 2); for (let j = 0; j < 6; j++) { ell(ctx, bx + (j % 2 ? 1.8 : -1.8), -h - 3 - j * 4.6 * s, 3.2, 2.8, shade(c1, j % 2 ? 0.1 : -0.05), 0, 1.2); } } return; }
    if (id === 'edelweiss') { for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; leaf(ctx, hx, -h, a, 16 * s, 4.8, i % 2 ? '#fbfaf2' : '#efeddf', '#cfcbb4'); } circ(ctx, hx, -h, 4.5, '#f2d25a', 1.5); dots(ctx, [[-1.5, -1], [1.5, 0], [0, 1.5]].map(([x, y]) => [hx + x, -h + y]), 0.6, '#b8902a'); return; }
    if (id === 'eisblume' || id === 'mondblüte' || id === 'seelenblume') {
      const gl = ctx.createRadialGradient(hx, -h, 2, hx, -h, 32 * s); gl.addColorStop(0, id === 'mondblüte' ? 'rgba(200,220,255,.7)' : 'rgba(180,240,255,.6)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(hx - 40, -h - 40, 80, 80);
    }
    const sonne = id === 'sonnenblume', n = sonne ? 16 : id === 'ewigelotus' ? 10 : id === 'donnerdistel' ? 14 : 8;
    const pl = sonne ? 18 : 16, pw = sonne ? 4.2 : 7;
    // hintere Reihe (dunkler, versetzt), dann vordere Reihe
    for (let ring = 0; ring < 2; ring++) for (let i = 0; i < n; i++) {
      const a = i / n * TAU + ring * (Math.PI / n), L = pl * s * (ring ? 0.82 : 1);
      leaf(ctx, hx, -h, a, L, pw * (ring ? 0.9 : 1), ring ? shade(col(c1, i), -0.14) : col(c1, i), sonne ? shade(col(c1, i), -0.3) : null);
    }
    if (sonne) { circ(ctx, hx, -h, 10 * s, '#6a3d16', 1.8); circ(ctx, hx, -h, 6.4 * s, '#8a5424', 0); for (let i = 0; i < 10; i++) { const a = i * 2.4, rr = 1 + i * 0.7 * s; circ(ctx, hx + Math.cos(a) * rr, -h + Math.sin(a) * rr, 0.9, '#3a2008', 0); } }
    else { circ(ctx, hx, -h, 6 * s, id === 'donnerdistel' ? '#6a5ad0' : '#f6cf3a', 1.8); gloss(ctx, hx - 1.8, -h - 2, 2, 0.5); }
  },
  halm(ctx, p, k, fr, sw, r) {
    const id = p.id;
    for (let i = -1; i <= 1; i++) {
      const x1 = i * 9 + sw * 40, h = (62 - Math.abs(i) * 10) * k;
      if (id === 'bambus') { stem(ctx, i * 6, 0, x1, -h, i * 6, -h * 0.5, p.c1, 5); for (let j = 1; j < 4; j++) { const yy = -h * j / 4; ctx.beginPath(); ctx.moveTo(i * 6 + (x1 - i * 6) * (j / 4) - 3.5, yy); ctx.lineTo(i * 6 + (x1 - i * 6) * (j / 4) + 3.5, yy); ctx.lineWidth = 2; ctx.stroke(); } leaf(ctx, x1, -h, -0.7, 16 * k, 4, p.c2); leaf(ctx, x1, -h, -2.4, 16 * k, 4, p.c2); }
      else if (id === 'sonnenfeder') { stem(ctx, i * 6, 0, x1, -h, i * 6, -h * 0.5, '#d8a030', 3); for (let j = 0; j < 4; j++) { leaf(ctx, x1, -h + j * 6, -0.6 - 0.2 * j, 16 * k, 3.5, p.c1); leaf(ctx, x1, -h + j * 6, -2.6 + 0.2 * j, 16 * k, 3.5, p.c2); } }
      else { stem(ctx, i * 6, 0, x1, -h, i * 6, -h * 0.5, p.c2, 4); leaf(ctx, x1 * 0.5, -h * 0.4, i < 1 ? -2.3 : -0.8, 26 * k, 5, p.c2); }
    }
    if (id === 'mais' && fr > 0) { const s = 0.4 + 0.6 * fr; ell(ctx, 8, -30 * k, 6 * s, 13 * s, p.c1, 0.15); leaf(ctx, 8, -18 * k, -1.9, 14 * s, 4, p.c2); leaf(ctx, 8, -18 * k, -1.2, 14 * s, 4, p.c2); }
  },
  pilz(ctx, p, k, fr, sw, r) {
    const s = (0.4 + 0.6 * k) * (0.5 + 0.5 * Math.max(fr, 0.4));
    ell(ctx, 0, -14 * s, 6 * s, 14 * s, '#f6efd6');
    ctx.beginPath(); ctx.ellipse(0, -26 * s, 24 * s, 17 * s, 0, Math.PI, TAU); ctx.closePath(); fs(ctx, p.c1);
    circ(ctx, -9 * s, -34 * s, 3.5 * s, p.c2, 1); circ(ctx, 6 * s, -38 * s, 3 * s, p.c2, 1); circ(ctx, 13 * s, -30 * s, 2.5 * s, p.c2, 1);
    ell(ctx, -30 * s, -6, 6 * s, 9 * s, '#e8e0c6', 0.2, 1.5); circ(ctx, -32 * s, -14 * s, 5 * s, p.c1, 1.5);
  },
  kaktus(ctx, p, k, fr, sw, r) {
    const body = p.c1;
    ell(ctx, 0, -30 * k, 12 * k, 30 * k, body);
    ctx.beginPath(); ctx.moveTo(-9 * k, -30 * k); ctx.quadraticCurveTo(-26 * k, -30 * k, -24 * k, -48 * k); ctx.lineWidth = 9 * k + 3; ctx.strokeStyle = OUT; ctx.lineCap = 'round'; ctx.stroke(); ctx.lineWidth = 9 * k; ctx.strokeStyle = body; ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(9 * k, -22 * k); ctx.quadraticCurveTo(24 * k, -22 * k, 22 * k, -38 * k); ctx.lineWidth = 8 * k + 3; ctx.stroke(); ctx.lineWidth = 8 * k; ctx.strokeStyle = body; ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-3, -12 * k - i * 8 * k); ctx.lineTo(3, -12 * k - i * 8 * k - 2); ctx.lineWidth = 1; ctx.stroke(); }
    ctx.lineWidth = 2;
    if (fr > 0.3) { for (let i = 0; i < 5; i++) leaf(ctx, 0, -60 * k, i / 5 * TAU, 9 * fr, 3.6, p.c2); circ(ctx, 0, -60 * k, 3, '#ffe27a', 1.2); }
  },
  kristall(ctx, p, k, fr, sw, r) {
    const gl = ctx.createRadialGradient(0, -22 * k, 2, 0, -22 * k, 36 * k); gl.addColorStop(0, 'rgba(255,255,255,.55)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(-50, -70, 100, 80);
    const shards = [[0, 50, 11], [-14, 34, 9], [14, 38, 9], [-24, 22, 7], [24, 24, 7]];
    shards.forEach(([x, h, w], i) => {
      const hh = h * k * (i === 0 ? 0.6 + 0.4 * Math.max(fr, 0.3) : 1), lean = (x / 24) * 0.25;
      ctx.beginPath(); ctx.moveTo(x - w, 0); ctx.lineTo(x - w * 0.7 + lean * hh, -hh * 0.8); ctx.lineTo(x + lean * hh, -hh); ctx.lineTo(x + w * 0.7 + lean * hh, -hh * 0.8); ctx.lineTo(x + w, 0); ctx.closePath(); fs(ctx, col(p.c1, i));
      ctx.beginPath(); ctx.moveTo(x - w * 0.2, -hh * 0.2); ctx.lineTo(x - w * 0.1 + lean * hh, -hh * 0.9); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = OUT;
    });
  },
  rosette(ctx, p, k, fr, sw, r) {
    const id = p.id, n = id === 'urweltfarn' ? 9 : 8;
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * (id === 'urweltfarn' ? 0.36 : 0.4) + sw; leaf(ctx, 0, -4, a, (id === 'urweltfarn' ? 56 : 40) * k, id === 'urweltfarn' ? 8 : 6, p.c2, null); }
    if (id === 'urweltfarn') { for (let i = 0; i < 5; i++) star(ctx, (i - 2) * 11, -44 * k - Math.abs(i - 2) * -4, 3.5, p.c1); return; }
    if (fr > 0) {
      const s = 0.4 + 0.6 * fr; ell(ctx, 0, -17 * s, 13 * s, 18 * s, p.c1);
      ctx.save(); ctx.beginPath(); ctx.ellipse(0, -17 * s, 13 * s, 18 * s, 0, 0, TAU); ctx.clip(); ctx.strokeStyle = shade(p.c1, -0.35); ctx.lineWidth = 1.2;
      for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(-14 * s, i * 6 * s - 6 * s); ctx.lineTo(14 * s, i * 6 * s + 8 * s); ctx.moveTo(14 * s, i * 6 * s - 6 * s); ctx.lineTo(-14 * s, i * 6 * s + 8 * s); ctx.stroke(); } ctx.restore(); ctx.strokeStyle = OUT; ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) leaf(ctx, 0, -34 * s, -Math.PI / 2 + (i - 2) * 0.45, 14 * s, 4, '#3f9a3a');
    }
  },
  orb(ctx, p, k, fr, sw, r, tms) {
    const bob = Math.sin(tms / 600 + r * 6) * 3, s = 0.5 + 0.5 * Math.max(k, fr);
    for (let i = 0; i < 4; i++) leaf(ctx, 0, -2, -Math.PI / 2 + (i - 1.5) * 0.7, 22 * k, 5, '#2f6a3a');
    const cy = -34 * s + bob, R = 15 * s * (0.55 + 0.45 * Math.max(fr, 0.3));
    const gl = ctx.createRadialGradient(0, cy, 2, 0, cy, R * 2.8); gl.addColorStop(0, col(p.c1)); gl.addColorStop(0.35, col(p.c1) + '88'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 0.55; ctx.fillStyle = gl; ctx.fillRect(-R * 3, cy - R * 3, R * 6, R * 6); ctx.globalAlpha = 1;
    const g2 = ctx.createRadialGradient(-R * 0.3, cy - R * 0.3, 1, 0, cy, R); g2.addColorStop(0, '#ffffff'); g2.addColorStop(0.4, col(p.c1)); g2.addColorStop(1, col(p.c2));
    circ(ctx, 0, cy, R, g2, 2);
    for (let i = 0; i < 3; i++) { const a = tms / 900 + i * 2.1; star(ctx, Math.cos(a) * R * 1.7, cy + Math.sin(a) * R * 1.1, 3, col(p.c2)); }
  },
};

// Keimling (für alle Pflanzen gleich)
function sprout(ctx, p, sw) {
  stem(ctx, 0, 0, sw * 20, -14, 0, -8, '#6fb544', 3);
  leaf(ctx, sw * 20, -14, -0.5, 12, 5, '#7fd05a'); leaf(ctx, sw * 20, -14, -2.6, 12, 5, '#6fb544');
}

// f = Fortschritt 0–1, ripe = erntereif
export function drawPlant(ctx, tile, cx, by, size, tms, seed, opt = {}) {
  const p = PLANTS[tile.id]; if (!p) return;
  const f = Math.min(1, tile.prog / tile.total), ripe = f >= 1, muts = tile.muts || [];
  const r = ((seed * 9301 + 49297) % 233280) / 233280;
  const sw = Math.sin(tms / 800 + seed) * 0.05 * (opt.wind || 1);
  const u = size / 100 * 1.08;
  ctx.save(); ctx.translate(cx, by); ctx.scale(u, u);
  { const w = 18 + 14 * Math.min(1, f + 0.2); ctx.fillStyle = 'rgba(30,15,0,.28)'; ctx.beginPath(); ctx.ellipse(0, 1, w, 4.5, 0, 0, TAU); ctx.fill(); }
  if (muts.includes('riesig')) ctx.scale(1.25, 1.25);
  ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  // Regenbogen-Bogen hinter der Pflanze
  if (muts.includes('regenbogen')) { for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(0, -4, 44 - i * 4, Math.PI, TAU); ctx.strokeStyle = rainbow(i, 0); ctx.globalAlpha = 0.55; ctx.lineWidth = 4; ctx.stroke(); } ctx.globalAlpha = 1; ctx.strokeStyle = OUT; ctx.lineWidth = 2; }
  if (muts.includes('lunar')) { const g = ctx.createRadialGradient(0, -30, 4, 0, -30, 52); g.addColorStop(0, 'rgba(160,185,255,.55)'); g.addColorStop(1, 'rgba(160,185,255,0)'); ctx.fillStyle = g; ctx.fillRect(-60, -90, 120, 100); }
  if (f < 0.12) sprout(ctx, p, sw);
  else {
    const k = 0.35 + 0.65 * Math.min(1, (f - 0.12) / 0.7), fr = Math.max(0, (f - 0.82) / 0.18);
    if (muts.includes('frostig')) ctx.filter = 'saturate(.55) brightness(1.15)';
    A[p.arche](ctx, p, k, ripe ? 1 : fr, sw, r, tms);
    ctx.filter = 'none';
  }
  // Mutations-Verzierung
  if (muts.includes('gold')) { for (let i = 0; i < 4; i++) { const a = tms / 700 + i * 1.6, rr = 34 + Math.sin(tms / 400 + i) * 4; star(ctx, Math.cos(a) * rr * 0.8, -34 + Math.sin(a) * rr * 0.6, 4.5, '#ffd54a'); } }
  if (muts.includes('nass')) { for (let i = 0; i < 4; i++) { ctx.fillStyle = 'rgba(120,200,255,.9)'; ctx.beginPath(); ctx.arc(-18 + i * 12, -20 - (i % 2) * 14, 2.6, 0, TAU); ctx.fill(); } }
  if (muts.includes('geladen')) { ctx.strokeStyle = (Math.floor(tms / 150) % 2) ? '#fff27a' : '#ffffff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-14, -64); ctx.lineTo(-4, -46); ctx.lineTo(-12, -44); ctx.lineTo(0, -22); ctx.stroke(); ctx.strokeStyle = OUT; ctx.lineWidth = 2; }
  if (muts.includes('frostig')) { ctx.fillStyle = 'rgba(210,240,255,.85)'; for (let i = 0; i < 5; i++) { ctx.beginPath(); const x = -22 + i * 11, y = -10 - (i % 3) * 18; ctx.moveTo(x, y - 6); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 3, y); ctx.fill(); } }
  if (muts.includes('reif')) { for (let i = 0; i < 4; i++) { ctx.fillStyle = '#d9822b'; ctx.beginPath(); ctx.ellipse(-20 + i * 13, -6 - (i % 2) * 8, 4, 2.2, i, 0, TAU); ctx.fill(); } }
  ctx.restore();
}

// Mini-Bild für Listen: eine Pflanze voll gewachsen
export function plantIcon(canvas, id, muts = [], tms = 0) {
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  drawPlant(ctx, { id, prog: 1, total: 1, muts }, w / 2, h * 0.92, Math.min(w, h) * 0.95, tms, 3, { wind: 0 });
}

// ── Welt ───────────────────────────────────────────────
function skyColors(hour) {
  // Stunde 0–24 → [oben, unten]
  const K = [[0, '#0d1230', '#233060'], [5, '#2a2f60', '#c07a8a'], [7, '#6fb4e8', '#f6d8a0'], [12, '#4aa3e8', '#bfe4ff'], [17, '#5aa0e0', '#f6d6a0'], [19, '#6a5a9a', '#f08a5a'], [21, '#1a2050', '#3a3a78'], [24, '#0d1230', '#233060']];
  for (let i = 0; i < K.length - 1; i++) if (hour >= K[i][0] && hour <= K[i + 1][0]) { const t = (hour - K[i][0]) / (K[i + 1][0] - K[i][0]); return [mix(K[i][1], K[i + 1][1], t), mix(K[i][2], K[i + 1][2], t)]; }
  return [K[0][1], K[0][2]];
}
export const GRASS = ['#8fcf5a', '#7ac24a', '#c9a44a', '#dfeaf0'];   // Frühling Sommer Herbst Winter
const HILL = ['#7fbf6a', '#6aae5a', '#b88f4a', '#c9d8e6'];

export function drawWorld(ctx, W, H, o) {
  const { now, season, weather, ts, skyH, gebaeude } = o;
  const d = new Date(now), hour = d.getHours() + d.getMinutes() / 60;
  const [top, bot] = skyColors(hour);
  const g = ctx.createLinearGradient(0, 0, 0, skyH); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, W, skyH + 2);
  const night = hour < 5.5 || hour > 20.5;
  if (night) { for (let i = 0; i < 26; i++) { const x = (i * 97 % 100) / 100 * W, y = (i * 53 % 70) / 100 * skyH; ctx.fillStyle = `rgba(255,255,240,${0.4 + 0.4 * Math.sin(now / 500 + i)})`; ctx.fillRect(x, y, 2, 2); } }
  // Sonne/Mond
  const arc = (hour - 6) / 14; if (arc > -0.05 && arc < 1.05) { const sx = W * (0.08 + 0.84 * arc), sy = skyH * (0.85 - 0.6 * Math.sin(Math.max(0, Math.min(1, arc)) * Math.PI)); circ(ctx, sx, sy, ts * 0.28, '#ffe27a', 0); const gl = ctx.createRadialGradient(sx, sy, 4, sx, sy, ts * 0.9); gl.addColorStop(0, 'rgba(255,230,140,.5)'); gl.addColorStop(1, 'rgba(255,230,140,0)'); ctx.fillStyle = gl; ctx.fillRect(sx - ts, sy - ts, ts * 2, ts * 2); }
  else { const m = ((hour + 24 - 20) % 24) / 10; const sx = W * (0.1 + 0.8 * Math.min(1, m)), sy = skyH * (0.8 - 0.55 * Math.sin(Math.min(1, m) * Math.PI)); circ(ctx, sx, sy, ts * 0.2, '#f2f0dc', 0); circ(ctx, sx + ts * 0.07, sy - ts * 0.03, ts * 0.18, top, 0); }
  // Wolken
  const dunkel = ['wolken', 'regen', 'gewitter', 'nebel', 'schnee'].includes(weather), nc = dunkel ? 5 : 2;
  for (let i = 0; i < nc; i++) { const x = ((now / (60 + i * 20) + i * 170) % (W + 200)) - 100, y = skyH * (0.15 + 0.12 * i % 0.5), s = ts * (0.5 + 0.12 * (i % 3)); ctx.fillStyle = weather === 'gewitter' ? '#6a6f80' : dunkel ? (night ? '#4a4f68' : '#e4e8ee') : (night ? '#3a4068' : '#ffffff'); ctx.globalAlpha = 0.92; ctx.beginPath(); ctx.arc(x, y, s * 0.5, 0, TAU); ctx.arc(x + s * 0.5, y + 4, s * 0.42, 0, TAU); ctx.arc(x - s * 0.5, y + 6, s * 0.38, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; }
  // Hügel
  ctx.fillStyle = shade(HILL[season], -0.12); ctx.beginPath(); ctx.moveTo(0, skyH); ctx.quadraticCurveTo(W * 0.25, skyH - ts * 0.9, W * 0.5, skyH - ts * 0.2); ctx.quadraticCurveTo(W * 0.75, skyH - ts * 0.7, W, skyH - ts * 0.1); ctx.lineTo(W, skyH + 4); ctx.lineTo(0, skyH + 4); ctx.fill();
  ctx.fillStyle = HILL[season]; ctx.beginPath(); ctx.moveTo(0, skyH + 2); ctx.quadraticCurveTo(W * 0.3, skyH - ts * 0.35, W * 0.6, skyH - ts * 0.05); ctx.quadraticCurveTo(W * 0.85, skyH - ts * 0.3, W, skyH); ctx.lineTo(W, skyH + 4); ctx.lineTo(0, skyH + 4); ctx.fill();
  // Gras
  ctx.fillStyle = GRASS[season]; ctx.fillRect(0, skyH, W, H - skyH);
  ctx.strokeStyle = OUT; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, skyH); ctx.lineTo(W, skyH); ctx.stroke();
  // Hofgebäude am Horizont
  drawHouse(ctx, W * 0.1, skyH, ts);
  if (gebaeude.scheune) drawBarn(ctx, W * 0.88, skyH, ts, gebaeude.scheune);
  if (gebaeude.marktstand) drawStall(ctx, W * 0.72, skyH, ts, gebaeude.marktstand);
  if (gebaeude.brunnen) drawWell(ctx, W * 0.34, skyH + ts * 0.2, ts, gebaeude.brunnen);
  if (gebaeude.kompost) drawCompost(ctx, W * 0.55, skyH + ts * 0.15, ts, gebaeude.kompost);
}
function drawHouse(ctx, x, y, ts) {
  const w = ts * 0.9, h = ts * 0.6;
  ctx.fillStyle = OUT; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.rect(x - w / 2, y - h, w, h); fs(ctx, '#f2e2c0');
  ctx.beginPath(); ctx.moveTo(x - w * 0.6, y - h); ctx.lineTo(x, y - h - ts * 0.4); ctx.lineTo(x + w * 0.6, y - h); ctx.closePath(); fs(ctx, '#c8553a');
  ctx.beginPath(); ctx.rect(x - w * 0.1, y - h * 0.55, w * 0.22, h * 0.55); fs(ctx, '#8a5a34');
  ctx.beginPath(); ctx.rect(x + w * 0.22, y - h * 0.8, w * 0.2, h * 0.3); fs(ctx, '#bfe4ff');
  ctx.beginPath(); ctx.rect(x - w * 0.42, y - h * 0.8, w * 0.2, h * 0.3); fs(ctx, '#bfe4ff');
  ctx.beginPath(); ctx.rect(x + w * 0.28, y - h - ts * 0.3, w * 0.12, ts * 0.22); fs(ctx, '#8a8a8a');
}
function drawBarn(ctx, x, y, ts, lv) {
  const s = 0.85 + lv * 0.15, w = ts * 0.9 * s, h = ts * 0.6 * s;
  ctx.beginPath(); ctx.rect(x - w / 2, y - h, w, h); fs(ctx, '#b8433a');
  ctx.beginPath(); ctx.moveTo(x - w * 0.58, y - h); ctx.lineTo(x - w * 0.3, y - h - ts * 0.3 * s); ctx.lineTo(x + w * 0.3, y - h - ts * 0.3 * s); ctx.lineTo(x + w * 0.58, y - h); ctx.closePath(); fs(ctx, '#7a4a2a');
  ctx.beginPath(); ctx.rect(x - w * 0.22, y - h * 0.6, w * 0.44, h * 0.6); fs(ctx, '#e8d8b0');
  ctx.beginPath(); ctx.moveTo(x - w * 0.22, y - h * 0.6); ctx.lineTo(x + w * 0.22, y); ctx.moveTo(x + w * 0.22, y - h * 0.6); ctx.lineTo(x - w * 0.22, y); ctx.stroke();
}
function drawStall(ctx, x, y, ts, lv) {
  const w = ts * 0.8, h = ts * 0.5;
  ctx.beginPath(); ctx.rect(x - w / 2, y - h * 0.5, w, h * 0.5); fs(ctx, '#a8744a');
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.rect(x - w * 0.55 + i * w * 0.185, y - h * 1.2, w * 0.185, h * 0.5); fs(ctx, i % 2 ? '#ffffff' : '#d8413a', 1.5); }
  ctx.beginPath(); ctx.moveTo(x - w * 0.45, y - h * 0.7); ctx.lineTo(x - w * 0.45, y - h * 0.5); ctx.moveTo(x + w * 0.45, y - h * 0.7); ctx.lineTo(x + w * 0.45, y - h * 0.5); ctx.stroke();
  for (let i = 0; i < 2 + lv; i++) circ(ctx, x - w * 0.3 + i * w * 0.2, y - h * 0.58, 4, ['#e8392e', '#f2b81e', '#6fb544'][i % 3], 1.5);
}
function drawWell(ctx, x, y, ts, lv) {
  const r = ts * 0.22;
  ctx.beginPath(); ctx.rect(x - r * 1.1, y - r * 1.6, r * 0.2, r * 1.8); fs(ctx, '#7a5230'); ctx.beginPath(); ctx.rect(x + r * 0.9, y - r * 1.6, r * 0.2, r * 1.8); fs(ctx, '#7a5230');
  ctx.beginPath(); ctx.moveTo(x - r * 1.5, y - r * 1.6); ctx.lineTo(x, y - r * 2.4); ctx.lineTo(x + r * 1.5, y - r * 1.6); ctx.closePath(); fs(ctx, lv >= 3 ? '#4a8ad0' : '#c8553a');
  ell(ctx, x, y - r * 0.2, r * 1.2, r * 0.6, '#9a9a9a'); ell(ctx, x, y - r * 0.25, r * 0.9, r * 0.38, '#3a7ad0', 0, 1.5);
}
function drawCompost(ctx, x, y, ts, lv) {
  const w = ts * (0.35 + lv * 0.06);
  ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y - ts * 0.5, x + w, y); ctx.closePath(); fs(ctx, '#6a4a2a');
  for (let i = 0; i < 4; i++) leaf(ctx, x - w * 0.5 + i * w * 0.35, y - ts * 0.1, -1.5 + i * 0.5, 9, 3, '#8aae4a');
}

export function drawWeatherFx(ctx, W, H, weather, now) {
  if (weather === 'regen' || weather === 'gewitter') {
    ctx.strokeStyle = 'rgba(190,220,255,.7)'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i < 90; i++) { const x = (i * 83 + now / 4) % (W + 40) - 20, y = (i * 47 + now * 0.9) % H; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 12); } ctx.stroke();
    if (weather === 'gewitter' && (Math.floor(now / 3000) % 7 === 0) && (now % 3000) < 160) { ctx.fillStyle = 'rgba(255,255,230,.5)'; ctx.fillRect(0, 0, W, H); }
  } else if (weather === 'schnee') {
    ctx.fillStyle = 'rgba(255,255,255,.9)';
    for (let i = 0; i < 70; i++) { const x = (i * 71 + Math.sin(now / 900 + i) * 14 + 200) % (W + 20), y = (i * 53 + now * 0.05) % H; ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3) * 0.6, 0, TAU); ctx.fill(); }
  } else if (weather === 'nebel') {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(235,240,245,.35)'); g.addColorStop(1, 'rgba(235,240,245,.15)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
}

// Ein Feld. x,y = linke obere Ecke
export function drawTileBase(ctx, x, y, ts, o) {
  const { boden, wasser, season, glas, owned, kosten, kaufbar, ripe } = o, pad = 3, s = ts - pad * 2;
  const rr = ts * 0.12;
  const path = () => { ctx.beginPath(); ctx.roundRect(x + pad, y + pad, s, s, rr); };
  if (!owned) {
    path(); ctx.fillStyle = shade(GRASS[season], -0.06); ctx.fill(); ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(43,36,24,.45)'; ctx.lineWidth = 2; ctx.stroke(); ctx.setLineDash([]); ctx.strokeStyle = OUT;
    if (kosten != null) {
      ctx.fillStyle = kaufbar ? '#2b2418' : 'rgba(43,36,24,.5)'; ctx.font = `bold ${Math.round(ts * 0.2)}px system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Land', x + ts / 2, y + ts * 0.38); ctx.fillText(kosten + ' €', x + ts / 2, y + ts * 0.62);
    }
    return;
  }
  const dry = mix('#b79b6c', '#6a4a2a', Math.min(1, 0.35 + boden / 160)), wet = shade(dry, -0.28);
  path(); ctx.fillStyle = wasser > 0 ? wet : dry; ctx.fill();
  ctx.save(); path(); ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 2;
  for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(x + pad, y + pad + i * s / 5); ctx.lineTo(x + pad + s, y + pad + i * s / 5); ctx.stroke(); }
  if (wasser > 0) { ctx.fillStyle = 'rgba(120,190,255,.14)'; ctx.fillRect(x, y, ts, ts); }
  ctx.restore();
  path(); ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; ctx.stroke();
  if (season === 3) { ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.roundRect(x + pad, y + pad, s, s * 0.14, rr); ctx.fill(); }
  // Fruchtbarkeit als kleiner Balken unten
  const bw = s * 0.7, bx = x + ts / 2 - bw / 2, by = y + ts - pad - 7;
  ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.roundRect(bx, by, bw, 4, 2); ctx.fill();
  ctx.fillStyle = boden > 60 ? '#6fd04a' : boden > 30 ? '#e8c53a' : '#e0553a'; ctx.beginPath(); ctx.roundRect(bx, by, Math.max(2, bw * boden / 100), 4, 2); ctx.fill();
}
export function drawGlasRoof(ctx, x, y, ts, cols, rows) {
  const w = ts * cols, h = ts * rows;
  ctx.fillStyle = 'rgba(190,230,255,.22)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); for (let i = 1; i < cols; i++) { ctx.moveTo(x + i * ts, y); ctx.lineTo(x + i * ts, y + h); } ctx.stroke();
  ctx.strokeStyle = OUT; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
}
export function drawReadyMark(ctx, x, y, ts, tms) {
  const b = Math.sin(tms / 250) * 3;
  ctx.fillStyle = '#fff6b0'; ctx.strokeStyle = OUT; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(x + ts - 14, y + 14 + b, 9, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + ts - 18, y + 14 + b); ctx.lineTo(x + ts - 15, y + 17 + b); ctx.lineTo(x + ts - 10, y + 10 + b); ctx.lineWidth = 2.2; ctx.stroke();
}
export function drawDrop(ctx, x, y, s, fill = '#3a8ae8') {
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x + s * 0.9, y + s * 0.2, x, y + s * 0.8); ctx.quadraticCurveTo(x - s * 0.9, y + s * 0.2, x, y - s); ctx.fillStyle = fill; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = OUT; ctx.stroke();
}
