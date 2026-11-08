// Spieldaten: Pflanzen, Seltenheiten, Mutationen, Gebäude
export const MIN = 60000, STUNDE = 3600000;

export const SEASONS = ['Frühling', 'Sommer', 'Herbst', 'Winter'];
export const SEASON_KEYS = ['f', 's', 'h', 'w'];

export const RARITIES = ['gewöhnlich', 'ungewöhnlich', 'selten', 'legendär', 'mythisch', 'göttlich', 'prismatisch', 'transzendent', 'himmlisch', 'kosmisch', 'uralt', 'absolut'];
export const HIDDEN = ['kosmisch', 'uralt', 'absolut'];
export const RARITY_WEIGHT = { 'gewöhnlich': 5000, 'ungewöhnlich': 2500, 'selten': 1000, 'legendär': 800, 'mythisch': 600, 'göttlich': 500, 'prismatisch': 300, 'transzendent': 150, 'himmlisch': 50 };
export const RARITY_STOCK = { 'gewöhnlich': [6, 12], 'ungewöhnlich': [4, 8], 'selten': [2, 5], 'legendär': [1, 3], 'mythisch': [1, 2], 'göttlich': [1, 1], 'prismatisch': [1, 1], 'transzendent': [1, 1], 'himmlisch': [1, 1] };
export const RARITY_COLOR = {
  'gewöhnlich': '#9aa0a6', 'ungewöhnlich': '#5cb85c', 'selten': '#3b8fd9', 'legendär': '#e8c53a', 'mythisch': '#a24fd0',
  'göttlich': '#e9e4d0', 'prismatisch': 'rainbow', 'transzendent': '#7b6cf0', 'himmlisch': '#f08a3a',
  'kosmisch': '#38d6e8', 'uralt': '#c98a2a', 'absolut': '#ffffff'
};

// Händler-Ruf: schaltet Seltenheiten im Samen-Markt frei
export const RUF = [
  { name: 'Unbekannt', ab: 0, bis: 'selten' },
  { name: 'Bekannt', ab: 10, bis: 'legendär' },
  { name: 'Angesehen', ab: 30, bis: 'mythisch' },
  { name: 'Geschätzt', ab: 75, bis: 'göttlich' },
  { name: 'Berühmt', ab: 175, bis: 'prismatisch' },
  { name: 'Gefeiert', ab: 280, bis: 'transzendent' },
  { name: 'Legendär', ab: 400, bis: 'himmlisch' },
];

// Mutationen: Aufschlag wird addiert (Wert = Basis × (1 + Summe der Aufschläge))
export const MUT = {
  gold:       { name: 'Gold',       plus: 0.5, farbe: '#f5c542' },
  regenbogen: { name: 'Regenbogen', plus: 2.0, farbe: 'rainbow' },
  riesig:     { name: 'Riesig',     plus: 1.0, farbe: '#7bd36b' },
  nass:       { name: 'Betaut',     plus: 0.25, farbe: '#6ec6ff' },
  geladen:    { name: 'Geladen',    plus: 1.0, farbe: '#ffe94a' },
  frostig:    { name: 'Frostig',    plus: 0.5, farbe: '#bfe9ff' },
  reif:       { name: 'Herbstreif', plus: 0.5, farbe: '#d9822b' },
  lunar:      { name: 'Lunar',      plus: 0.5, farbe: '#9db4ff' },
};

// Pflanzenfamilien (Fruchtfolge) = Zeichen-Archetyp
// Format: id, Name, Seltenheit, Archetyp, Farbe1, Farbe2, Preis, Minuten, Wert, s=einmal/m=mehrfach, Jahreszeit (f s h w a)
const T = [
  ['karotte', 'Karotte', 'gewöhnlich', 'wurzel', '#f0892b', '#4fae4a', 2, 3, 5, 's', 'f'],
  ['kartoffel', 'Kartoffel', 'gewöhnlich', 'wurzel', '#c9a46a', '#4f9a45', 3, 9, 9, 's', 'h'],
  ['salat', 'Salat', 'gewöhnlich', 'blatt', '#8fd45a', '#5fae3a', 2, 3, 2, 'm', 'f'],
  ['blume', 'Blume', 'gewöhnlich', 'blume', '#f07aa8', '#4fae4a', 5, 3, 4, 'm', 'f'],
  ['erdbeere', 'Erdbeere', 'gewöhnlich', 'busch', '#e0364a', '#3f9a3f', 4, 6, 3, 'm', 'f'],
  ['moosblatt', 'Moosblatt', 'gewöhnlich', 'blatt', '#4d8a46', '#2f6a35', 4, 3, 3, 'm', 'a'],
  ['ruebe', 'Rübe', 'gewöhnlich', 'wurzel', '#b46fc4', '#5aa845', 3, 6, 5, 's', 'h'],
  ['mais', 'Mais', 'gewöhnlich', 'halm', '#f2d23c', '#6fb544', 3, 6, 2, 'm', 's'],
  ['gurke', 'Gurke', 'gewöhnlich', 'ranke', '#4fa843', '#3b8a3a', 3, 3, 3, 'm', 's'],
  ['brokkoli', 'Brokkoli', 'gewöhnlich', 'blatt', '#3f9a4a', '#2f7a3a', 4, 6, 7, 's', 'h'],
  ['erbsenschote', 'Erbsenschote', 'gewöhnlich', 'ranke', '#8ed05a', '#4fa843', 3, 3, 2, 'm', 'f'],

  ['zwiebel', 'Zwiebel', 'ungewöhnlich', 'wurzel', '#f0d9a0', '#6fb544', 5, 6, 14, 's', 'h'],
  ['kuerbis', 'Kürbis', 'ungewöhnlich', 'ranke', '#f28a1e', '#4f9a3a', 9, 12, 27, 's', 'h'],
  ['tomate', 'Tomate', 'ungewöhnlich', 'busch', '#e8392e', '#3f9a3f', 5, 6, 4, 'm', 's'],
  ['paprika', 'Paprika', 'ungewöhnlich', 'busch', '#e8a21e', '#3f9a3f', 8, 9, 7, 'm', 's'],
  ['blaubeere', 'Blaubeere', 'ungewöhnlich', 'busch', '#4a62d0', '#3f8a45', 9, 9, 8, 'm', 's'],
  ['zitronengras', 'Zitronengras', 'ungewöhnlich', 'halm', '#b8d84a', '#7fb544', 7, 6, 6, 'm', 's'],
  ['lavendel', 'Lavendel', 'ungewöhnlich', 'blume', '#9a6fe0', '#6fa55a', 10, 9, 23, 's', 's'],
  ['aubergine', 'Aubergine', 'ungewöhnlich', 'busch', '#7a3a9a', '#3f8a45', 8, 9, 6, 'm', 's'],
  ['knoblauch', 'Knoblauch', 'ungewöhnlich', 'wurzel', '#f2ecd8', '#6fb544', 6, 6, 15, 's', 'h'],
  ['suesskartoffel', 'Süßkartoffel', 'ungewöhnlich', 'wurzel', '#c8603a', '#5aa845', 7, 9, 19, 's', 'h'],
  ['bohnen', 'Bohnen', 'ungewöhnlich', 'ranke', '#6fb544', '#3f8a3a', 6, 6, 5, 'm', 's'],
  ['zitrone', 'Zitrone', 'ungewöhnlich', 'baum', '#f5dc3a', '#4f9a45', 5, 6, 13, 's', 's'],
  ['kirsche', 'Kirsche', 'ungewöhnlich', 'baum', '#d0243a', '#4f9a45', 6, 6, 6, 'm', 'f'],
  ['orange', 'Orange', 'ungewöhnlich', 'baum', '#f58a1e', '#4f9a45', 8, 9, 7, 'm', 's'],
  ['olive', 'Olive', 'ungewöhnlich', 'baum', '#6f7a3a', '#6f9a55', 7, 9, 18, 's', 'h'],

  ['wassermelone', 'Wassermelone', 'selten', 'ranke', '#3f9a4a', '#4fa843', 16, 15, 55, 's', 's'],
  ['kokosnuss', 'Kokosnuss', 'selten', 'baum', '#8a5a34', '#4fa850', 20, 18, 62, 's', 's'],
  ['bambus', 'Bambus', 'selten', 'halm', '#8ec45a', '#5a9a3a', 13, 12, 9, 'm', 'a'],
  ['sonnenblume', 'Sonnenblume', 'selten', 'blume', '#f7c61e', '#4f9a3a', 15, 12, 10, 'm', 's'],
  ['kaktus', 'Kaktus', 'selten', 'kaktus', '#4fa86a', '#f06aa0', 19, 15, 13, 'm', 's'],
  ['pilz', 'Pilz', 'selten', 'pilz', '#c8453a', '#f2ead0', 21, 15, 57, 's', 'h'],
  ['edelweiss', 'Edelweiß', 'selten', 'blume', '#f4f1e4', '#8ab07a', 20, 18, 22, 'm', 'w'],
  ['mango', 'Mango', 'selten', 'baum', '#f2a31e', '#4f9a45', 17, 12, 9, 'm', 's'],
  ['ingwer', 'Ingwer', 'selten', 'wurzel', '#d8b070', '#7fb544', 20, 15, 53, 's', 'w'],
  ['kastanie', 'Kastanie', 'selten', 'baum', '#7a4a2a', '#5a8a3a', 18, 15, 48, 's', 'h'],
  ['erdnuss', 'Erdnuss', 'selten', 'busch', '#d8b47a', '#5aa845', 14, 9, 10, 'm', 'h'],
  ['apfel', 'Apfel', 'selten', 'baum', '#d8322e', '#4f9a45', 12, 12, 11, 'm', 'h'],
  ['birne', 'Birne', 'selten', 'baum', '#b8cc3a', '#4f9a45', 14, 12, 13, 'm', 'h'],
  ['pfirsich', 'Pfirsich', 'selten', 'baum', '#f5a07a', '#4f9a45', 16, 12, 16, 'm', 's'],
  ['ananas', 'Ananas', 'selten', 'rosette', '#f2b81e', '#4f9a3a', 19, 15, 51, 's', 's'],
  ['avocado', 'Avocado', 'selten', 'baum', '#4a6a2a', '#4f9a45', 22, 15, 58, 's', 's'],
  ['melone', 'Melone', 'selten', 'ranke', '#d8d070', '#5aa845', 17, 15, 46, 's', 's'],

  ['drachenfrucht', 'Drachenfrucht', 'legendär', 'kaktus', '#e8359a', '#f6e24a', 35, 24, 120, 's', 's'],
  ['mandragora', 'Mandragora', 'legendär', 'wurzel', '#a07a50', '#4f8a3a', 45, 30, 173, 's', 'h'],
  ['feuerrose', 'Feuerrose', 'legendär', 'blume', '#f2452a', '#ff9a2a', 38, 24, 27, 'm', 's'],
  ['mondblüte', 'Mondblüte', 'legendär', 'blume', '#cfe0ff', '#6f8ad0', 60, 36, 42, 'm', 'w'],
  ['eisblume', 'Eisblume', 'legendär', 'blume', '#aee6ff', '#7fc4e8', 56, 30, 192, 's', 'w'],
  ['glanzkraut', 'Glanzkraut', 'legendär', 'blatt', '#f0e27a', '#bfb04a', 63, 36, 47, 'm', 'a'],
  ['geisterkraut', 'Geisterkraut', 'legendär', 'blatt', '#e6eef2', '#aab8c4', 42, 27, 35, 'm', 'a'],
  ['donnerdistel', 'Donnerdistel', 'legendär', 'blume', '#ffe040', '#6a5ad0', 47, 30, 180, 's', 'a'],

  ['kristallrose', 'Kristallrose', 'mythisch', 'kristall', '#ff7ac8', '#ffd0ee', 80, 45, 357, 's', 'a'],
  ['himmelstraube', 'Himmels-Traube', 'mythisch', 'busch', '#6a5ae0', '#4a9a5a', 95, 54, 458, 's', 'a'],
  ['sternenkuerbis', 'Sternenkürbis', 'mythisch', 'ranke', '#f6d83a', '#5aa86a', 100, 60, 102, 'm', 'a'],
  ['traumwinde', 'Traumwinde', 'mythisch', 'blume', '#b88aff', '#7a6ae0', 128, 60, 130, 'm', 'a'],
  ['nebelrose', 'Nebelrose', 'mythisch', 'blume', '#c4ccd8', '#8a96a8', 100, 48, 85, 'm', 'a'],
  ['schattenblatt', 'Schattenblatt', 'mythisch', 'blatt', '#4a2a6a', '#2a1a4a', 107, 51, 413, 's', 'a'],

  ['weltbaum', 'Weltbaum', 'göttlich', 'baum', '#e8c84a', '#3f9a55', 200, 90, 620, 's', 'a'],
  ['ewigelotus', 'Ewige Lotusblüte', 'göttlich', 'blume', '#ffb0d8', '#5ac8a8', 280, 120, 196, 'm', 'a'],
  ['sonnenfeder', 'Sonnenfeder', 'göttlich', 'halm', '#ffcf4a', '#ff9a3a', 230, 105, 747, 's', 'a'],
  ['aetherwurzel', 'Ätherwurzel', 'göttlich', 'wurzel', '#5ae0e8', '#3aa8d0', 210, 96, 142, 'm', 'a'],
  ['seelenblume', 'Seelenblume', 'göttlich', 'blume', '#6af0e0', '#3a9ad0', 260, 114, 183, 'm', 'a'],

  ['prismatic', 'Prismatische Blume', 'prismatisch', 'blume', 'rainbow', '#6ac84a', 450, 150, 383, 'm', 'a'],
  ['lichtkelch', 'Lichtkelch', 'prismatisch', 'kristall', '#ffd84a', '#fff4b0', 500, 165, 1925, 's', 'a'],
  ['regenbogenkraut', 'Regenbogenkraut', 'prismatisch', 'blatt', 'rainbow', '#4aa850', 480, 156, 403, 'm', 'a'],

  ['voidblume', 'Void-Blume', 'transzendent', 'orb', '#6a2ad0', '#1a0a3a', 1100, 240, 1210, 'm', 'a'],
  ['sternenflamme', 'Sternenflamme', 'transzendent', 'orb', '#ff8a2a', '#ffd84a', 1200, 270, 1380, 'm', 'a'],
  ['leerebluete', 'Leereblüte', 'transzendent', 'orb', '#3a2a5a', '#b88aff', 1050, 240, 4620, 's', 'a'],
  ['zeitkraut', 'Zeitkraut', 'transzendent', 'orb', '#6ae0c8', '#e8f8f0', 1300, 300, 6500, 's', 'a'],

  ['sonnenkern', 'Sonnenkern', 'himmlisch', 'orb', '#ffd02a', '#ff7a1a', 2200, 540, 5940, 'm', 'a'],
  ['mondkern', 'Mondkern', 'himmlisch', 'orb', '#d8e4ff', '#8aa0d8', 2000, 480, 10800, 's', 'a'],
  ['sternenkern', 'Sternenkern', 'himmlisch', 'orb', '#6aa0ff', '#d8e8ff', 2400, 600, 6720, 'm', 'a'],

  ['galaxiebluete', 'Galaxieblüte', 'kosmisch', 'orb', '#2a6ad0', '#88f0ff', 5000, 720, 18000, 'm', 'a'],
  ['urweltfarn', 'Urweltfarn', 'uralt', 'rosette', '#3a8a5a', '#c98a2a', 12000, 1200, 60000, 's', 'a'],
  ['omegarose', 'Omegarose', 'absolut', 'orb', '#ffffff', '#ffd0f0', 25000, 2160, 200000, 's', 'a'],
];

export const PLANTS = {};
for (const [id, name, rar, arche, c1, c2, preis, min, wert, typ, saison] of T) {
  PLANTS[id] = { id, name, rar, arche, c1, c2, preis, min, wert, typ, saison };
}
export const PLANT_IDS = Object.keys(PLANTS);

// Gebäude: Stufen mit Kosten
export const BUILDINGS = {
  brunnen:      { name: 'Brunnen', kosten: [60, 300, 1500], text: ['Wasser hält 1,5× länger', 'Wasser hält 2× länger', 'Wasser hält 3× länger, der Brunnen gießt von allein'] },
  gewaechshaus: { name: 'Gewächshaus', kosten: [150, 800, 4000], text: ['Erste Reihe: keine Jahreszeiten-Nachteile', 'Zwei Reihen geschützt', 'Drei Reihen geschützt'] },
  scheune:      { name: 'Scheune', kosten: [50, 400, 2500], text: ['Lager für 80 Ernten', 'Lager für 150 Ernten', 'Lager für 300 Ernten'] },
  marktstand:   { name: 'Marktstand', kosten: [80, 500, 3000], text: ['Samen-Markt zeigt 5 Karten', '6 Karten', '7 Karten'] },
  kompost:      { name: 'Kompost', kosten: [40, 250, 1200], text: ['Entfernte Pflanzen: 40 % zurück, Erde erholt sich 2× schneller', '50 % zurück, 3× schneller', '60 % zurück, 4× schneller'] },
};

export const START = { geld: 20, felderStart: 10, felderMax: 30, spalten: 5 };
export const LAGER_BASIS = 40;
export const LAGER_STUFEN = [40, 80, 150, 300];
export function feldPreis(n) { return Math.round(15 * Math.pow(1.22, n - START.felderStart)); }
