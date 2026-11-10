// Wiki für Erntezeit: Aufbruch. Alle Zahlen kommen direkt aus den Spieldaten, damit nichts veraltet.
import { PLANTS, PLANT_IDS, RARITIES, HIDDEN, RARITY_WEIGHT, RARITY_STOCK, RARITY_COLOR, RUF, MUT, SEASONS, SEASON_KEYS, BUILDINGS, START, LAGER_STUFEN, MIN, STUNDE, feldPreis } from '../js/data.js';
import { GEBIETE, DAUER, EREIGNISSE, reiseKosten } from '../js/reisen.js';
import { AUFTRAG_SLOTS, AUFTRAG_DAUER } from '../js/auftraege.js';
import { SEASON_MS, WETTER_MS, WETTER_NAME, MAX_OFFLINE } from '../js/logic.js';
import { plantIcon } from '../js/art.js';

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const zahl = (n, d = 0) => (+n).toLocaleString('de-DE', { maximumFractionDigits: d, minimumFractionDigits: 0 });
const dauer = ms => {
  const m = Math.round(ms / MIN);
  if (m < 60) return m + ' Min.';
  const h = Math.floor(m / 60), r = m % 60;
  return h + ' Std.' + (r ? ' ' + r + ' Min.' : '');
};
const sicher = RARITIES.filter(r => !HIDDEN.includes(r));
const sichtbar = PLANT_IDS.filter(id => !HIDDEN.includes(PLANTS[id].rar));   // geheime Pflanzen stehen bewusst nicht im Wiki
const ri = r => RARITIES.indexOf(r);
const saisonName = k => k === 'a' ? 'keine' : SEASONS[SEASON_KEYS.indexOf(k)];
const SAISON_ICON = { f: '🌱', s: '☀️', h: '🍂', w: '❄️' };

function badge(r) {
  const c = RARITY_COLOR[r], hell = ['#e9e4d0', '#ffffff', '#e8c53a'].includes(c);
  return c === 'rainbow' ? `<span class="badge regenbogen">${esc(r)}</span>` : `<span class="badge ${hell ? 'hell' : ''}" style="background:${c}">${esc(r)}</span>`;
}
function mutBadge(k) {
  const m = MUT[k];
  return m.farbe === 'rainbow' ? `<span class="badge regenbogen">${esc(m.name)}</span>` : `<span class="badge hell" style="background:${m.farbe}">${esc(m.name)}</span>`;
}
function ufStufe(r) { return RUF.find(s => ri(s.bis) >= ri(r)); }
function plantChip(id) { return `<button class="chipbild" data-pflanze="${id}"><canvas width="56" height="56" data-pi="${id}"></canvas>${esc(PLANTS[id].name)}</button>`; }
function gebieteMit(id) { return GEBIETE.filter(g => g.pool.includes(id)); }
// Ertrag über die ganze Lebenszeit einer Pflanze (Grundtempo): mehrfach = bis zu 4 Ernten à 2–4 (Ø 3), Nachwuchs braucht je die halbe Zeit
function lebensdaten(p) {
  if (p.typ === 's') return { menge: 1, zeit: p.min * MIN };
  return { menge: 12, zeit: p.min * MIN * 2.5 };
}
const proStunde = p => { const l = lebensdaten(p); return p.wert * l.menge / (l.zeit / STUNDE); };

function zeichne(wurzel) {
  wurzel.querySelectorAll('canvas[data-pi]').forEach(c => plantIcon(c, c.dataset.pi, c.dataset.m ? c.dataset.m.split(',') : [], 0));
}

// ── Seiten ──────────────────────────────────────────────
const SEITEN = [
  ['start', 'Überblick'], ['pflanzen', 'Pflanzen'], ['wachsen', 'Wachsen'], ['mutationen', 'Mutationen'], ['jahr', 'Jahreszeiten & Wetter'],
  ['markt', 'Markt & Ruf'], ['aufbruch', 'Aufbruch'], ['hof', 'Hof & Gebäude'], ['auftraege', 'Aufträge'], ['rechner', 'Rechner'],
];

function seiteStart() {
  return `<h1>Willkommen auf dem Hof</h1>
  <p class="lead">Du pflanzt, gießt, erntest und verkaufst. Mit dem Geld kaufst du Land, Gebäude und seltenere Samen. Wenn der Markt nicht mehr reicht, brichst du auf und suchst Samen in fernen Gebieten.</p>
  <div class="raster">
    <a class="karte pk" href="#/pflanzen" style="text-decoration:none"><div><div class="n">🌿 Pflanzen</div><div class="m">${sichtbar.length} Pflanzen mit Werten, Fundorten und Rechner</div></div></a>
    <a class="karte pk" href="#/wachsen" style="text-decoration:none"><div><div class="n">⏱ Wachsen</div><div class="m">Wasser, Boden, Fruchtfolge, Tempo</div></div></a>
    <a class="karte pk" href="#/markt" style="text-decoration:none"><div><div class="n">💰 Markt &amp; Ruf</div><div class="m">Was es wann zu kaufen gibt</div></div></a>
    <a class="karte pk" href="#/aufbruch" style="text-decoration:none"><div><div class="n">🧭 Aufbruch</div><div class="m">${GEBIETE.length} Gebiete, Reisen, Ereignisse</div></div></a>
    <a class="karte pk" href="#/mutationen" style="text-decoration:none"><div><div class="n">✨ Mutationen</div><div class="m">${Object.keys(MUT).length} Veränderungen, die mehr wert sind</div></div></a>
    <a class="karte pk" href="#/rechner" style="text-decoration:none"><div><div class="n">🧮 Rechner</div><div class="m">Verkaufswert und Wachstumszeit</div></div></a>
  </div>
  <h2>Der Einstieg in fünf Zeilen</h2>
  <div class="karte"><ol style="margin:0;padding-left:20px">
    <li>Du startest mit ${START.geld} Münzen, ${START.felderStart} Feldern und Karotten-Samen, die du immer kaufen kannst.</li>
    <li>Pflanzen gießen: Ohne Wasser wächst alles nur halb so schnell.</li>
    <li>Ernten und verkaufen. Jede Pflanze, die du pflanzt, erhöht deinen Ruf.</li>
    <li>Mit mehr Ruf zeigt der Markt seltenere Pflanzen und neue Gebiete öffnen sich.</li>
    <li>Der Hof läuft weiter, auch wenn du nicht da bist (bis zu ${MAX_OFFLINE / (24 * STUNDE)} Tage).</li>
  </ol></div>
  <div class="hinweis"><b>Geheimnisse:</b> Dieses Wiki zeigt alles, was du im Spiel finden kannst – bis auf die Pflanzen, die in keiner Liste stehen. Die entdeckst du am besten selbst. Wer sie findet, sieht sie danach im Index im Spiel.</div>`;
}

function seitePflanzen(p) {
  return `<h1>Pflanzen</h1><p class="lead">${sichtbar.length} Pflanzen in ${sicher.length} Seltenheiten. Tippe auf eine Pflanze für alle Werte.</p>
  <div class="werkzeug"><input id="f-suche" type="search" placeholder="Pflanze suchen …" aria-label="Pflanze suchen" value="${esc(p.q || '')}">
  <select id="f-sort" aria-label="Sortieren"><option value="rar">Nach Seltenheit</option><option value="name">Nach Name</option><option value="wert">Nach Verkaufswert</option><option value="std">Nach Gewinn pro Stunde</option><option value="zeit">Nach Wachstumszeit</option></select></div>
  <div class="chips" id="f-rar"><button class="chip an" data-r="">Alle</button>${sicher.map(r => `<button class="chip" data-r="${r}">${esc(r)}</button>`).join('')}</div>
  <div class="chips" id="f-sai"><button class="chip an" data-s="">Jede Jahreszeit</button>${SEASON_KEYS.map(k => `<button class="chip" data-s="${k}">${SAISON_ICON[k]} ${saisonName(k)}</button>`).join('')}<button class="chip" data-s="a">Keine feste</button></div>
  <div class="raster" id="liste"></div><p class="leise klein" id="leer" hidden>Nichts gefunden.</p>`;
}
function pflanzenListe() {
  const q = ($('#f-suche').value || '').trim().toLowerCase(), sort = $('#f-sort').value;
  const r = $('#f-rar .an').dataset.r, s = $('#f-sai .an').dataset.s;
  let ids = sichtbar.filter(id => { const p = PLANTS[id]; return (!q || p.name.toLowerCase().includes(q)) && (!r || p.rar === r) && (!s || p.saison === s); });
  const cmp = { rar: (a, b) => ri(PLANTS[a].rar) - ri(PLANTS[b].rar) || PLANTS[a].name.localeCompare(PLANTS[b].name, 'de'), name: (a, b) => PLANTS[a].name.localeCompare(PLANTS[b].name, 'de'),
    wert: (a, b) => PLANTS[b].wert - PLANTS[a].wert, std: (a, b) => proStunde(PLANTS[b]) - proStunde(PLANTS[a]), zeit: (a, b) => PLANTS[a].min - PLANTS[b].min };
  ids.sort(cmp[sort]);
  $('#liste').innerHTML = ids.map(id => { const p = PLANTS[id]; return `<button class="karte pk" data-pflanze="${id}"><canvas width="112" height="112" data-pi="${id}"></canvas><div><div class="n">${esc(p.name)}</div><div class="m">${badge(p.rar)} ${p.saison === 'a' ? '' : `<span class="saison">${SAISON_ICON[p.saison]} ${saisonName(p.saison)}</span>`}</div><div class="m">${zahl(p.wert)} € · ${dauer(p.min * MIN)}</div></div></button>`; }).join('');
  $('#leer').hidden = ids.length > 0; zeichne($('#liste'));
}

function pflanzeDetail(id) {
  const p = PLANTS[id]; if (!p || HIDDEN.includes(p.rar)) return '<p>Diese Pflanze gibt es hier nicht.</p>';
  const l = lebensdaten(p), st = ufStufe(p.rar), geb = gebieteMit(id);
  const wo = [];
  if (p.preis != null) wo.push(`Samen-Markt (ab Ruf „${st.name}“, ${st.ab} Ruf)`);
  geb.forEach(g => wo.push(`${g.name} (ab Ruf ${g.ruf})`));
  const mutZeilen = Object.keys(MUT).map(k => `<tr><td>${mutBadge(k)}</td><td class="zahl">+${zahl(MUT[k].plus * 100)} %</td><td class="zahl">${zahl(p.wert * (1 + MUT[k].plus), 1)} €</td></tr>`).join('');
  return `<div class="kopfbild"><canvas width="300" height="300" data-pi="${id}"></canvas><div><h1 style="margin:0">${esc(p.name)}</h1><p style="margin:6px 0">${badge(p.rar)}</p><p class="leise klein" style="margin:0">Familie: ${esc(p.arche)}</p></div></div>
  <div class="karte">
    <div class="paar"><span>Samenpreis</span><span>${zahl(p.preis)} €</span></div>
    <div class="paar"><span>Wachstumszeit</span><span>${dauer(p.min * MIN)}</span></div>
    <div class="paar"><span>Ernte</span><span>${p.typ === 'm' ? 'mehrfach (bis zu 4 Ernten, je 2–4 Stück)' : 'einmal, 1 Stück'}</span></div>
    <div class="paar"><span>Verkaufswert</span><span>${zahl(p.wert)} € pro Stück</span></div>
    <div class="paar"><span>Lieblings-Jahreszeit</span><span>${p.saison === 'a' ? 'keine (wächst immer gleich)' : SAISON_ICON[p.saison] + ' ' + saisonName(p.saison)}</span></div>
    <div class="paar"><span>Gewinn pro Stunde</span><span>≈ ${zahl(proStunde(p) - p.preis / (l.zeit / STUNDE), 1)} € <span class="leise klein">(ohne Boni, abzgl. Samen)</span></span></div>
    <div class="paar"><span>Zu finden</span><span>${wo.map(esc).join('<br>')}</span></div>
  </div>
  <h3>Wert mit Mutation</h3><table class="tabelle"><tr><th>Mutation</th><th class="zahl">Aufschlag</th><th class="zahl">Wert</th></tr>${mutZeilen}</table>
  <p class="klein leise">Mehrere Mutationen werden addiert, nicht multipliziert. <a href="#/rechner">Zum Rechner</a></p>`;
}

function seiteWachsen() {
  return `<h1>Wachsen</h1><p class="lead">Wie schnell eine Pflanze wächst, hängt von sechs Dingen ab. Die Wachstumszeit in der Pflanzenliste gilt für ein Feld mit Wasser, frischer Erde und normalem Wetter.</p>
  <h2>Das Wachstumstempo</h2>
  <div class="scroll"><table class="tabelle"><tr><th>Einfluss</th><th>Faktor</th><th>Hinweis</th></tr>
    <tr><td>Lieblings-Jahreszeit</td><td class="zahl">× 1,3</td><td>Die Pflanze wächst schneller in ihrer Saison.</td></tr>
    <tr><td>Gegen-Jahreszeit</td><td class="zahl">× 0,7</td><td>Die Jahreszeit gegenüber, z. B. Winter bei Sommer-Pflanzen.</td></tr>
    <tr><td>Winter (nicht Lieblingszeit)</td><td class="zahl">× 0,85</td><td>Gilt für alle ungeschützten Pflanzen, die nicht im Winter zu Hause sind.</td></tr>
    <tr><td>Kein Wasser</td><td class="zahl">× 0,5</td><td>Halbe Geschwindigkeit, bis du gießt oder es regnet.</td></tr>
    <tr><td>Erde</td><td class="zahl">× 0,6 – 1,0</td><td>Bei 100 % Erde volle Kraft, bei 0 % nur × 0,6.</td></tr>
    <tr><td>Regen</td><td class="zahl">× 1,1</td><td>Regen gießt außerdem alle Felder.</td></tr>
    <tr><td>Sonne</td><td class="zahl">× 1,05</td><td></td></tr>
    <tr><td>Riesige Pflanze</td><td class="zahl">Zeit × 1,4</td><td>Riesig dauert länger, bringt aber +100 % Wert.</td></tr>
  </table></div>
  <p class="klein leise">Pflanzen ohne Lieblings-Jahreszeit („keine“) ignorieren die Jahreszeiten. Die Faktoren werden multipliziert. Im <a href="#/rechner">Rechner</a> kannst du das ausprobieren.</p>
  <h2>Wasser</h2>
  <div class="karte"><p>Beim Pflanzen bekommt das Feld Wasser. Es hält ${dauer(6 * MIN)} und läuft dann leer. Im Sommer bei Sonne trocknet es 1,4× schneller. Regen, Gewitter und Schnee füllen alle Felder wieder auf.</p>
  <p>Der <a href="#/hof">Brunnen</a> verlängert die Haltezeit (bis 3×) und gießt auf der letzten Stufe von allein.</p></div>
  <h2>Erde und Fruchtfolge</h2>
  <div class="karte"><p>Jedes Pflanzen kostet das Feld <b>8 %</b> Erde. Wächst auf einem Feld nacheinander zweimal dieselbe Familie, kostet es <b>16 %</b> (Monokultur). Leere Felder erholen sich: 1 % pro Minute, mit Kompost bis 4 % pro Minute.</p>
  <p>Wechselst du die Familie, gibt es <b>Fruchtfolge-Bonus</b>: Bei der ersten Ernte kommt mit 50 % Chance ein Stück mehr. Welche Familie eine Pflanze hat, steht in der Pflanzenansicht.</p></div>
  <h2>Ernte</h2>
  <div class="karte"><p><b>Einmal-Pflanzen</b> geben 1 Stück und verschwinden. <b>Mehrfach-Pflanzen</b> geben 2–4 Stück, wachsen dann in der halben Zeit nach und sind nach der vierten Ernte verwelkt.</p>
  <p>Ernten kommen ins Lager (${LAGER_STUFEN[0]} Plätze, ausbaubar bis ${LAGER_STUFEN[LAGER_STUFEN.length - 1]}). Ist es voll, wird nicht geerntet.</p></div>
  <h2>Land</h2>
  <div class="karte"><p>Du startest mit ${START.felderStart} Feldern, maximal gibt es ${START.felderMax}. Neue Felder werden pro Stück teurer.</p>
  <div class="scroll"><table class="tabelle" style="min-width:0"><tr><th>Feld Nr.</th><th class="zahl">Preis</th></tr>${[11, 15, 20, 25, 30].map(n => `<tr><td>${n}</td><td class="zahl">${zahl(feldPreis(n - 1))} €</td></tr>`).join('')}</table></div></div>`;
}

function seiteMutationen() {
  return `<h1>Mutationen</h1><p class="lead">Mutierte Pflanzen sind mehr wert. Der Aufschlag wird auf den Grundwert addiert: Gold und Riesig zusammen bedeuten × 2,5.</p>
  <div class="scroll"><table class="tabelle"><tr><th>Mutation</th><th class="zahl">Aufschlag</th><th>Woher</th></tr>
    <tr><td>${mutBadge('gold')}</td><td class="zahl">+50 %</td><td>5 % beim Pflanzen. Oder Fund in der Kristallhöhle.</td></tr>
    <tr><td>${mutBadge('regenbogen')}</td><td class="zahl">+200 %</td><td>1 % beim Pflanzen. Auch: Scheint die Sonne nach Regen, kann es wachsende Pflanzen treffen.</td></tr>
    <tr><td>${mutBadge('riesig')}</td><td class="zahl">+100 %</td><td>Fund aus dem Sumpf. Wächst 1,4× länger.</td></tr>
    <tr><td>${mutBadge('nass')}</td><td class="zahl">+25 %</td><td>Regen auf wachsenden Pflanzen. Oder Fund am Waldrand.</td></tr>
    <tr><td>${mutBadge('geladen')}</td><td class="zahl">+100 %</td><td>Blitz im Gewitter auf ungeschützten Feldern. Oder Fund auf der Himmelsinsel.</td></tr>
    <tr><td>${mutBadge('frostig')}</td><td class="zahl">+50 %</td><td>Im Winter auf ungeschützten Feldern (nicht bei Winter-Pflanzen). Oder Fund im Bergpass.</td></tr>
    <tr><td>${mutBadge('reif')}</td><td class="zahl">+50 %</td><td>Im Herbst auf ungeschützten Feldern. Oder Fund in der Wüste.</td></tr>
    <tr><td>${mutBadge('lunar')}</td><td class="zahl">+50 %</td><td>Nur als Fund im Nebelmoor.</td></tr>
  </table></div>
  <h2>Wie sie entstehen</h2>
  <div class="karte"><p><b>Beim Pflanzen:</b> Jede Pflanze hat 5 % Chance auf Gold und 1 % auf Regenbogen.</p>
  <p><b>Beim Wachsen:</b> Das Wetter verändert wachsende Pflanzen, jede Minute mit einer kleinen Chance. Ein Gewächshausfeld schützt vor Gewitter, Frost und Herbst, aber nicht vor Regen.</p>
  <p><b>Als Samen:</b> Auf Reisen gefundene Samen sind zu 18 % mutiert, mit der Mutation des Gebiets. Aus einem mutierten Samen wächst eine mutierte Pflanze. Samen mit Mutation werden im Lager getrennt gezählt.</p></div>
  <div class="scroll"><table class="tabelle"><tr><th>Wetter</th><th class="zahl">Chance pro Minute</th><th>Mutation</th></tr>
    <tr><td>Gewitter</td><td class="zahl">4 %</td><td>${mutBadge('geladen')}</td></tr>
    <tr><td>Regen</td><td class="zahl">3 %</td><td>${mutBadge('nass')}</td></tr>
    <tr><td>Winter</td><td class="zahl">1,5 %</td><td>${mutBadge('frostig')}</td></tr>
    <tr><td>Herbst</td><td class="zahl">1 %</td><td>${mutBadge('reif')}</td></tr>
    <tr><td>Sonne nach Regen</td><td class="zahl">6 % einmalig</td><td>${mutBadge('regenbogen')}</td></tr></table></div>`;
}

function seiteJahr() {
  const W = [
    ['Frühling', { regen: 25, gewitter: 5, wolken: 20, sonne: 50 }], ['Sommer', { regen: 12, gewitter: 6, wolken: 12, sonne: 70 }],
    ['Herbst', { regen: 28, gewitter: 6, nebel: 18, wolken: 20, sonne: 28 }], ['Winter', { schnee: 40, nebel: 20, wolken: 25, sonne: 15 }]];
  const cols = ['sonne', 'wolken', 'regen', 'gewitter', 'nebel', 'schnee'];
  return `<h1>Jahreszeiten &amp; Wetter</h1><p class="lead">Ein Spieljahr dauert 12 echte Stunden: Jede Jahreszeit ${dauer(SEASON_MS)}. Das Wetter wechselt alle ${dauer(WETTER_MS)} und ist für alle Spieler gleich.</p>
  <div class="raster">${SEASON_KEYS.map((k, i) => `<div class="karte"><div class="n" style="font-weight:900;font-size:18px">${SAISON_ICON[k]} ${SEASONS[i]}</div><p class="klein" style="margin-top:6px">${['Regen füllt die Felder, viele Obst- und Gemüsesorten wachsen schnell.', 'Heiße Tage trocknen die Felder schneller. Sonnig und mit viel Ertrag.', 'Nebel und Regen. Pilze, Kürbisse und Wurzeln haben Hochsaison.', 'Schnee gießt die Felder. Ungeschützte Pflanzen wachsen langsamer.'][i]}</p>
      <p class="klein leise" style="margin:0">Passende Pflanzen: ${sichtbar.filter(id => PLANTS[id].saison === k).length}</p></div>`).join('')}</div>
  <h2>Wetter-Wahrscheinlichkeiten</h2>
  <div class="scroll"><table class="tabelle"><tr><th>Jahreszeit</th>${cols.map(c => `<th class="zahl">${WETTER_NAME[c]}</th>`).join('')}</tr>
  ${W.map(([n, w]) => `<tr><td>${n}</td>${cols.map(c => `<td class="zahl">${w[c] ? w[c] + ' %' : '–'}</td>`).join('')}</tr>`).join('')}</table></div>
  <h2>Gewächshaus</h2><div class="karte"><p>Geschützte Felder (die ersten Reihen oben) kennen keine Jahreszeiten-Nachteile und werden nicht von Blitz, Frost oder Herbst verändert. Mehr dazu unter <a href="#/hof">Hof &amp; Gebäude</a>.</p></div>`;
}

function seiteMarkt() {
  const raritaeten = sicher.map(r => `<tr><td>${badge(r)}</td><td class="zahl">${RARITY_WEIGHT[r]}</td><td class="zahl">${RARITY_STOCK[r][0] === RARITY_STOCK[r][1] ? RARITY_STOCK[r][0] : RARITY_STOCK[r][0] + '–' + RARITY_STOCK[r][1]}</td><td>${ufStufe(r).name}</td></tr>`).join('');
  return `<h1>Markt &amp; Ruf</h1><p class="lead">Der Samen-Markt wechselt zur vollen Stunde und zeigt allen Spielern dieselben Karten.</p>
  <h2>Samen-Markt</h2>
  <div class="karte"><p>Es liegen 4 Karten aus (mit Marktstand bis 7). Welche, entscheidet der Zufall – seltene Pflanzen erscheinen deutlich seltener und mit kleinem Vorrat. Karotten-Samen gibt es immer.</p></div>
  <div class="scroll"><table class="tabelle"><tr><th>Seltenheit</th><th class="zahl">Gewicht</th><th class="zahl">Vorrat</th><th>Ab Ruf</th></tr>${raritaeten}</table></div>
  <p class="klein leise">Ein höheres Gewicht heißt: erscheint öfter. Die Pflanzen mit der höchsten Seltenheit bekommst du nur über Reisen.</p>
  <h2>Händler-Ruf</h2>
  <div class="karte"><p>Ruf bekommst du für jede gepflanzte Pflanze (+1), für Reisen und Aufträge. Er schaltet Seltenheiten im Markt und neue Gebiete frei.</p></div>
  <div class="scroll"><table class="tabelle"><tr><th>Stufe</th><th class="zahl">Ruf</th><th>Markt zeigt bis</th></tr>${RUF.map(s => `<tr><td><b>${s.name}</b></td><td class="zahl">${s.ab}</td><td>${badge(s.bis)}</td></tr>`).join('')}</table></div>
  <h2>Verkaufen</h2>
  <div class="karte"><p>Verkauft wird zum Grundwert mal Mutations-Aufschlag mal <b>Nachfrage</b>. Jedes verkaufte Stück senkt den Preis dieser Pflanze um 3 %, bis höchstens auf die Hälfte. Die Nachfrage erholt sich mit der Zeit (etwa ein Stück alle 2 Minuten). Wer verschiedene Pflanzen verkauft, bekommt bessere Preise.</p></div>`;
}

function seiteAufbruch() {
  const dTab = DAUER.map((d, i) => `<tr><td><b>${d.name}</b></td><td class="zahl">${dauer(d.ms)}</td><td class="zahl">${d.seeds[0]}–${d.seeds[1]}</td><td class="zahl">× ${zahl(d.bonus, 1)}</td><td class="zahl">× ${zahl(d.f, 1)}</td><td class="zahl">+${i + 1} Ruf</td></tr>`).join('');
  const gebiete = GEBIETE.map((g, i) => `<div class="karte" style="border-left-width:10px;border-left-color:${g.farbe}">
    <div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><b style="font-size:18px">${esc(g.name)}</b><span class="leise klein">ab Ruf ${g.ruf} · Kurz ab ${zahl(reiseKosten(i, 0))} €, Lang ${zahl(reiseKosten(i, 2))} €</span></div>
    <p class="klein" style="margin:4px 0 8px">${esc(g.text)} Mutation hier: ${mutBadge(g.mut)}</p>
    <div class="symbole">${g.pool.map(plantChip).join('')}</div></div>`).join('');
  return `<h1>Aufbruch</h1><p class="lead">Mit dem Wagen schickst du dich auf Reisen. Zurück kommst du mit Samen, auch mit solchen, die der Markt (noch) nicht hat.</p>
  <div class="karte"><ol style="margin:0;padding-left:20px"><li>Gebiet und Dauer wählen, Proviant bezahlen.</li><li>Warten – die Reise läuft auch offline weiter.</li><li>Zurück: Ein Ereignis wartet, du wählst eine von zwei Möglichkeiten.</li><li>Samen, Ruf und manchmal Geld wandern in dein Lager.</li></ol></div>
  <h2>Dauer</h2>
  <div class="scroll"><table class="tabelle"><tr><th>Reise</th><th class="zahl">Zeit</th><th class="zahl">Samen</th><th class="zahl">Seltene Funde</th><th class="zahl">Proviant</th><th class="zahl">Ruf</th></tr>${dTab}</table></div>
  <p class="klein leise">Der Proviant wächst mit dem Gebiet: Basis 10 € × 3 pro Gebiet. Je länger die Reise, desto besser die Chance auf Seltenes. Das Wagenhaus erlaubt bis zu 3 Reisen gleichzeitig.</p>
  <h2>Gebiete</h2>${gebiete}
  <p class="klein leise">Ganz oben, wo die Welt anfängt, gibt es noch mehr zu finden als diese Liste zeigt.</p>
  <h2>Ereignisse</h2>
  <p>Bei der Rückkehr wartet eines von ${EREIGNISSE.length} Ereignissen auf dich. Du entscheidest dich für eine Seite:</p>
  <div class="raster">${EREIGNISSE.map(e => `<div class="karte"><b>${esc(e.titel)}</b><p class="klein" style="margin:4px 0 8px">${esc(e.text)}</p><div class="symbole"><span class="saison">A: ${esc(e.a.label)}</span><span class="saison">B: ${esc(e.b.label)}</span></div></div>`).join('')}</div>
  <p class="klein leise">Manche Entscheidungen sind sicher, andere ein Wagnis: Sie können Samen kosten oder Seltenes bringen.</p>`;
}

function seiteHof() {
  return `<h1>Hof &amp; Gebäude</h1><p class="lead">Mit Münzen baust du den Hof aus. Jedes Gebäude hat bis zu drei Stufen.</p>
  ${Object.values(BUILDINGS).map(b => `<h3>${esc(b.name)}</h3><div class="scroll"><table class="tabelle" style="min-width:0"><tr><th>Stufe</th><th class="zahl">Kosten</th><th>Wirkung</th></tr>${b.kosten.map((k, i) => `<tr><td>${i + 1}</td><td class="zahl">${zahl(k)} €</td><td>${esc(b.text[i])}</td></tr>`).join('')}</table></div>`).join('')}
  <h2>Wozu was?</h2>
  <div class="karte"><p><b>Brunnen</b> spart dir Gießen. <b>Gewächshaus</b> macht dich unabhängig von Jahreszeit und Wetter, aber nur auf den ersten Feldern (5 pro Stufe). <b>Scheune</b> vergrößert das Lager (${LAGER_STUFEN.join(' → ')}). <b>Marktstand</b> zeigt mehr Karten im Samen-Markt. <b>Wagenhaus</b> schickt mehr Wagen gleichzeitig los. <b>Kompost</b> gibt Geld beim Roden zurück und erholt die Erde schneller.</p></div>`;
}

function seiteAuftraege() {
  return `<h1>Aufträge</h1><p class="lead">Das Dorf bestellt Ernte. Wer liefert, bekommt Geld und Ruf.</p>
  <div class="karte"><ul style="margin:0;padding-left:20px">
    <li>Es gibt immer ${AUFTRAG_SLOTS} offene Aufträge. Jeder gilt ${dauer(AUFTRAG_DAUER)}, dann kommt ein neuer.</li>
    <li>Gefragt sind Pflanzen aus Seltenheiten, die dein Ruf schon freischaltet.</li>
    <li>Die Menge hängt von der Seltenheit ab: einfache Pflanzen 3–7 Stück, seltene 2–4, noch seltenere 1–3.</li>
    <li>Mit etwas Glück verlangt der Auftrag eine <b>mutierte</b> Pflanze (beliebige Mutation). Das zahlt etwa doppelt so viel Lohn.</li>
    <li>Der Lohn liegt klar über dem Marktpreis. Der Ruf-Gewinn steigt mit der Seltenheit.</li></ul></div>
  <div class="hinweis"><b>Tipp:</b> Ein Auftrag lohnt sich besonders für Pflanzen, bei denen du sowieso Überschuss hast. Beim Abgeben werden zuerst Stücke mit den wenigsten Mutationen genommen.</div>`;
}

function seiteRechner() {
  const opt = sichtbar.slice().sort((a, b) => PLANTS[a].name.localeCompare(PLANTS[b].name, 'de')).map(id => `<option value="${id}">${esc(PLANTS[id].name)}</option>`).join('');
  return `<h1>Rechner</h1><p class="lead">Zwei kleine Helfer. Alle Angaben sind Richtwerte aus den Spielregeln.</p>
  <h2>Verkaufswert</h2>
  <div class="karte"><div class="felder"><label>Pflanze<select id="r-id">${opt}</select></label><label>Stückzahl<input id="r-n" type="number" min="1" max="300" value="10"></label></div>
  <div class="chips" id="r-mut">${Object.keys(MUT).map(k => `<button class="chip" data-m="${k}">${esc(MUT[k].name)}</button>`).join('')}</div>
  <div class="ergebnis" id="r-out"></div></div>
  <h2>Wachstumszeit</h2>
  <div class="karte"><div class="felder">
    <label>Pflanze<select id="w-id">${opt}</select></label>
    <label>Jahreszeit<select id="w-s">${SEASONS.map((s, i) => `<option value="${i}">${s}</option>`).join('')}</select></label>
    <label>Wetter<select id="w-w">${['sonne', 'wolken', 'regen', 'gewitter', 'nebel', 'schnee'].map(w => `<option value="${w}">${WETTER_NAME[w]}</option>`).join('')}</select></label></div>
  <div class="felder"><label>Erde: <span id="w-bv">100</span> %<input id="w-b" type="range" min="0" max="100" value="100"></label>
  <label class="pruefen"><input id="w-wa" type="checkbox" checked> Feld hat Wasser</label><label class="pruefen"><input id="w-g" type="checkbox"> Im Gewächshaus</label><label class="pruefen"><input id="w-r" type="checkbox"> Riesig</label></div>
  <div class="ergebnis" id="w-out"></div></div>`;
}
function rechnerVerkauf() {
  const p = PLANTS[$('#r-id').value], n = Math.max(1, Math.min(300, +$('#r-n').value || 1));
  const muts = [...document.querySelectorAll('#r-mut .an')].map(b => b.dataset.m);
  const mult = 1 + muts.reduce((a, m) => a + MUT[m].plus, 0), einzel = p.wert * mult;
  let summe = 0, nach = 0;
  for (let i = 0; i < n; i++) { summe += einzel * Math.max(0.5, 1 - 0.03 * nach); nach++; }
  const l = lebensdaten(p);
  $('#r-out').innerHTML = `<div>Ein Stück: <b>${zahl(einzel, 1)} €</b> (× ${zahl(mult, 2)})</div><div>${n} Stück in einem Rutsch verkauft: <b>${zahl(summe)} €</b> <span class="leise klein">(Nachfrage sinkt um 3 % pro Stück, höchstens auf 50 %)</span></div>
    <div class="klein">Ohne Mutation liefert eine Pflanze über ihr Leben ${l.menge} Stück in ${dauer(l.zeit)} (Grundtempo), also ≈ ${zahl(proStunde(p), 1)} € pro Stunde.</div>`;
}
function rechnerWachsen() {
  const p = PLANTS[$('#w-id').value], s = +$('#w-s').value, w = $('#w-w').value, geschuetzt = $('#w-g').checked;
  const boden = +$('#w-b').value, wasser = $('#w-wa').checked, riesig = $('#w-r').checked;
  $('#w-bv').textContent = boden;
  let f = 1;
  if (p.saison !== 'a') { const ps = 'fshw'.indexOf(p.saison); if (geschuetzt) f *= 1; else if (ps === s) f *= 1.3; else if ((ps + 2) % 4 === s) f *= 0.7; else if (s === 3) f *= 0.85; }
  f *= wasser || ['regen', 'gewitter', 'schnee'].includes(w) ? 1 : 0.5;
  f *= 0.6 + 0.4 * (boden / 100);
  if (w === 'regen') f *= 1.1; else if (w === 'sonne') f *= 1.05;
  const basis = p.min * MIN * (riesig ? 1.4 : 1);
  $('#w-out').innerHTML = `<div>Tempo: <b>× ${zahl(f, 2)}</b></div><div>${esc(p.name)} braucht dann ca. <b>${dauer(basis / f)}</b> <span class="leise klein">(Grundzeit ${dauer(basis)})</span></div>${p.typ === 'm' ? `<div class="klein">Nachwuchs nach jeder Ernte: ca. ${dauer(basis * 0.5 / f)}</div>` : ''}`;
}

// ── Routing und Verdrahtung ─────────────────────────────
let aktuell = '', lagePflanzen = { q: '' };
function route() {
  const [, seite = 'start', arg] = (location.hash || '#/start').match(/^#\/([^/]*)\/?(.*)$/) || [];
  const s = SEITEN.some(x => x[0] === seite) ? seite : 'start';
  const inh = $('#inhalt'), neu = s !== aktuell;
  if (neu) {
    aktuell = s;
    const html = { start: seiteStart, pflanzen: () => seitePflanzen(lagePflanzen), wachsen: seiteWachsen, mutationen: seiteMutationen, jahr: seiteJahr, markt: seiteMarkt, aufbruch: seiteAufbruch, hof: seiteHof, auftraege: seiteAuftraege, rechner: seiteRechner }[s]();
    inh.innerHTML = html + `<footer>Die Zahlen stammen direkt aus dem Spiel und sind immer aktuell.</footer>`;
    document.title = (s === 'start' ? 'Wiki' : SEITEN.find(x => x[0] === s)[1] + ' – Wiki') + ' · Erntezeit: Aufbruch';
    window.scrollTo(0, 0);
    zeichne(inh);
    if (s === 'pflanzen') pflanzenListe();
    if (s === 'rechner') { rechnerVerkauf(); rechnerWachsen(); }
  }
  document.querySelectorAll('#nav a').forEach(a => a.classList.toggle('an', a.dataset.s === s));
  const an = $('#nav a.an'); if (an && matchMedia('(max-width:760px)').matches) an.scrollIntoView({ inline: 'center', block: 'nearest' });
  if (s === 'pflanzen' && arg && PLANTS[arg] && !HIDDEN.includes(PLANTS[arg].rar)) dialog(pflanzeDetail(arg)); else if (!$('#dlg').hidden && s !== 'pflanzen') schliessen(true);
}
function dialog(html) { $('#dlg-inhalt').innerHTML = html; $('#dlg').hidden = false; zeichne($('#dlg-inhalt')); $('#dlg-box').scrollTop = 0; $('#dlg-zu').focus(); }
function schliessen(still) {
  $('#dlg').hidden = true;
  if (!still && /^#\/pflanzen\/./.test(location.hash)) history.replaceState(null, '', '#/pflanzen');
}

$('#nav').innerHTML = SEITEN.map(([k, n]) => `<a href="#/${k}" data-s="${k}">${n}</a>`).join('');
addEventListener('hashchange', route);
document.addEventListener('click', e => {
  const pf = e.target.closest('[data-pflanze]');
  if (pf) { dialog(pflanzeDetail(pf.dataset.pflanze)); if (aktuell === 'pflanzen') history.replaceState(null, '', '#/pflanzen/' + pf.dataset.pflanze); return; }
  if (e.target.closest('#dlg-zu') || e.target.id === 'dlg') return schliessen();
  const ch = e.target.closest('.chip');
  if (ch) {
    if (ch.parentElement.id === 'r-mut') { ch.classList.toggle('an'); rechnerVerkauf(); }
    else if (ch.parentElement.id === 'f-rar' || ch.parentElement.id === 'f-sai') { ch.parentElement.querySelectorAll('.chip').forEach(c => c.classList.toggle('an', c === ch)); pflanzenListe(); }
  }
});
document.addEventListener('input', e => {
  const id = e.target.id;
  if (id === 'f-suche') { lagePflanzen.q = e.target.value; pflanzenListe(); }
  else if (id === 'f-sort') pflanzenListe();
  else if (id === 'r-id' || id === 'r-n') rechnerVerkauf();
  else if (id && id.startsWith('w-')) rechnerWachsen();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#dlg').hidden) schliessen(); });
route();
