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

function fs(ctx, fill, lw = 2) { ctx.fillStyle = fill; ctx.fill(); if (lw) { ctx.lineWidth = lw; ctx.stroke(); } }
function ell(ctx, x, y, rx, ry, fill, rot = 0, lw = 2) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); fs(ctx, fill, lw); }
function circ(ctx, x, y, r, fill, lw = 2) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, TAU); fs(ctx, fill, lw); }
function leaf(ctx, x, y, ang, len, wid, fill, vein) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(len * 0.5, -wid, len, 0); ctx.quadraticCurveTo(len * 0.5, wid, 0, 0); fs(ctx, fill, 1.8);
  if (vein) { ctx.beginPath(); ctx.moveTo(len * 0.1, 0); ctx.lineTo(len * 0.85, 0); ctx.strokeStyle = vein; ctx.lineWidth = 1; ctx.stroke(); ctx.strokeStyle = OUT; }
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

// ── Archetypen. Koordinaten: Ursprung = Fuß der Pflanze, nach oben negativ, Höhe ca. 90 ──
// k = Wuchs (0.3–1), fr = Reife der Frucht (0–1), sw = Schwanken, r = Zufall (0–1) je Feld
const A = {
  wurzel(ctx, p, k, fr, sw, r) {
    const n = 5;
    for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - 2) * 0.42 + sw; leaf(ctx, 0, -6, a, (38 + (i % 2) * 8) * k, 7 * k, p.c2, shade(p.c2, -0.3)); }
    if (fr > 0) {
      const s = 0.4 + 0.6 * fr;
      if (p.id === 'karotte') { ctx.beginPath(); ctx.moveTo(-9 * s, -8); ctx.quadraticCurveTo(0, -17 * s, 9 * s, -8); ctx.lineTo(1, 6 * s); ctx.lineTo(-1, 6 * s); ctx.closePath(); fs(ctx, p.c1); }
      else if (p.id === 'ingwer') { ell(ctx, -6, -6, 11 * s, 6 * s, p.c1, -0.3); ell(ctx, 7, -8, 9 * s, 5 * s, shade(p.c1, 0.1), 0.4); }
      else {
        ell(ctx, 0, -4, 13 * s, 10 * s, p.c1);
        ctx.beginPath(); ctx.arc(-4 * s, -8 * s, 3 * s, 3.4, 4.6); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = OUT;
        if (p.id === 'mandragora') { circ(ctx, -4, -5, 1.6, OUT, 0); circ(ctx, 4, -5, 1.6, OUT, 0); ctx.beginPath(); ctx.arc(0, -1, 3, 0.2, Math.PI - 0.2); ctx.lineWidth = 1.5; ctx.stroke(); }
        if (p.id === 'aetherwurzel') { circ(ctx, 0, -4, 6 * s, 'rgba(255,255,255,.5)', 0); }
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
    stem(ctx, -34 * k, -6, 0, -8, -16 * k, -22 * k, p.c2, 3);
    stem(ctx, 0, -8, 34 * k, -6, 18 * k, -20 * k, p.c2, 3);
    leaf(ctx, -18 * k, -14, -2.4, 18 * k, 8 * k, p.c2); leaf(ctx, 20 * k, -14, -0.8, 18 * k, 8 * k, p.c2); leaf(ctx, 0, -10, -Math.PI / 2, 22 * k, 8 * k, shade(p.c2, 0.1));
    if (fr > 0) {
      const s = 0.35 + 0.65 * fr, id = p.id;
      if (id === 'gurke' || id === 'bohnen' || id === 'erbsenschote') { ell(ctx, 0, -9, 20 * s, 6.5 * s, p.c1, id === 'gurke' ? 0.15 : -0.1); }
      else if (id === 'wassermelone') { ell(ctx, 0, -14 * s, 24 * s, 16 * s, p.c1); for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(i * 8 * s, -14 * s, 3 * s, 15 * s, 0, 0, TAU); ctx.strokeStyle = shade(p.c1, -0.35); ctx.lineWidth = 2; ctx.stroke(); } ctx.strokeStyle = OUT; ell(ctx, 0, -14 * s, 24 * s, 16 * s, 'rgba(0,0,0,0)'); }
      else if (id === 'kuerbis' || id === 'sternenkuerbis') { ell(ctx, -9 * s, -13 * s, 12 * s, 14 * s, shade(p.c1, -0.08)); ell(ctx, 9 * s, -13 * s, 12 * s, 14 * s, shade(p.c1, -0.08)); ell(ctx, 0, -14 * s, 14 * s, 16 * s, p.c1); stem(ctx, 0, -28 * s, 3, -34 * s, 0, -31 * s, '#6a8a3a', 4); if (id === 'sternenkuerbis') star(ctx, 0, -14 * s, 9 * s, '#fff2a0'); }
      else { ell(ctx, 0, -13 * s, 19 * s, 14 * s, p.c1); ctx.beginPath(); ctx.arc(-6 * s, -18 * s, 6 * s, 3.5, 4.7); ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 2; ctx.stroke(); ctx.strokeStyle = OUT; }
    }
  },
  busch(ctx, p, k, fr, sw, r) {
    const g = p.c2;
    circ(ctx, -14 * k, -18 * k, 16 * k, shade(g, -0.1)); circ(ctx, 14 * k, -18 * k, 16 * k, shade(g, -0.1)); circ(ctx, 0, -28 * k, 19 * k, g);
    if (fr > 0) {
      const pts = [[-14, -20], [8, -22], [-2, -34], [16, -12], [-20, -10], [4, -10], [-8, -26], [12, -34]];
      const n = Math.ceil(pts.length * fr), big = p.id === 'himmelstraube';
      for (let i = 0; i < n; i++) {
        const [x, y] = pts[i];
        if (big) { for (let j = 0; j < 3; j++) circ(ctx, x * k + (j - 1) * 4, y * k + (j % 2) * 4, 4.2, p.c1, 1.5); }
        else circ(ctx, x * k, y * k, 5.2 * (0.5 + 0.5 * fr), p.c1, 1.6);
      }
    }
  },
  baum(ctx, p, k, fr, sw, r) {
    const big = p.id === 'weltbaum', K = big ? 1.15 : 1, tr = big ? '#8a6a3a' : '#7a5230';
    if (p.id === 'kokosnuss') {
      stem(ctx, 0, 0, 4 * sw * 30, -52 * k, -6, -26 * k, tr, 7);
      const tx = 4 * sw * 30, ty = -52 * k;
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.62; leaf(ctx, tx, ty, a, 38 * k, 6, p.c2); }
      if (fr > 0) { circ(ctx, tx - 5, ty + 5, 5 * fr + 1, p.c1); circ(ctx, tx + 5, ty + 6, 5 * fr + 1, p.c1); }
      return;
    }
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-4, -30 * k * K); ctx.lineTo(4, -30 * k * K); ctx.lineTo(6, 0); ctx.closePath(); fs(ctx, tr);
    const cy = -42 * k * K;
    if (big) { const gl = ctx.createRadialGradient(0, cy, 4, 0, cy, 48 * k); gl.addColorStop(0, 'rgba(255,230,120,.55)'); gl.addColorStop(1, 'rgba(255,230,120,0)'); ctx.fillStyle = gl; ctx.fillRect(-60, cy - 60, 120, 120); }
    circ(ctx, -16 * k * K, cy + 6, 16 * k * K, shade(p.c2, -0.1)); circ(ctx, 16 * k * K, cy + 6, 16 * k * K, shade(p.c2, -0.1)); circ(ctx, 0, cy - 6 * k, 20 * k * K, p.c2);
    if (fr > 0) {
      const pts = [[-14, 6], [10, 10], [-2, -12], [18, -4], [-20, -6], [4, 20]], n = Math.ceil(pts.length * fr);
      for (let i = 0; i < n; i++) { const [x, y] = pts[i]; circ(ctx, x * k * K, cy + y * k, (big ? 5.5 : 5) * (0.5 + 0.5 * fr), p.id === 'zitrone' || p.id === 'olive' ? p.c1 : p.c1, 1.6); }
    }
  },
  blume(ctx, p, k, fr, sw, r) {
    const h = 44 * k, hx = sw * 30;
    stem(ctx, 0, 0, hx, -h, 0, -h * 0.5, '#4f9a3a', 4);
    leaf(ctx, 0, -h * 0.35, -0.5, 18 * k, 6, '#5aa845'); leaf(ctx, 0, -h * 0.25, -2.6, 18 * k, 6, '#5aa845');
    const id = p.id, c1 = p.c1;
    if (fr <= 0.2) { ell(ctx, hx, -h - 5, 6 * k + 2, 9 * k + 2, col(c1), 0); return; }
    const s = 0.4 + 0.6 * fr;
    if (id === 'lavendel') { for (let i = 0; i < 3; i++) { const bx = hx + (i - 1) * 7; stem(ctx, hx, -h * 0.6, bx, -h - 12, hx, -h * 0.8, '#6fa55a', 2); for (let j = 0; j < 5; j++) circ(ctx, bx + (j % 2 ? 1.5 : -1.5), -h - 4 - j * 5 * s, 3.2, c1, 1.2); } return; }
    if (id === 'edelweiss') { for (let i = 0; i < 9; i++) { const a = i / 9 * TAU; leaf(ctx, hx, -h, a, 15 * s, 4.5, '#fbfaf2', null); } circ(ctx, hx, -h, 4, '#f2d25a', 1.5); return; }
    if (id === 'eisblume' || id === 'mondblüte' || id === 'seelenblume') {
      const gl = ctx.createRadialGradient(hx, -h, 2, hx, -h, 30 * s); gl.addColorStop(0, id === 'mondblüte' ? 'rgba(200,220,255,.7)' : 'rgba(180,240,255,.6)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(hx - 40, -h - 40, 80, 80);
    }
    const n = id === 'sonnenblume' ? 14 : id === 'ewigelotus' ? 10 : id === 'donnerdistel' ? 12 : 8;
    const pl = id === 'sonnenblume' ? 17 : 15;
    for (let ring = id === 'ewigelotus' ? 2 : 1; ring > 0; ring--) for (let i = 0; i < n; i++) { const a = i / n * TAU + ring * 0.3; leaf(ctx, hx, -h, a, pl * s * (ring === 2 ? 1 : 0.8), id === 'sonnenblume' ? 4.5 : 6.5, col(c1, i, performance.now ? 0 : 0), null); }
    circ(ctx, hx, -h, (id === 'sonnenblume' ? 9 : 5.5) * s, id === 'sonnenblume' ? '#7a4a1e' : id === 'donnerdistel' ? '#6a5ad0' : '#f6cf3a', 1.8);
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
  const u = size / 100;
  ctx.save(); ctx.translate(cx, by); ctx.scale(u, u);
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
