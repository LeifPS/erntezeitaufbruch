# Erntezeit: Aufbruch

Neufassung von Erntezeit: ein Hofspiel in Echtzeit mit Jahreszeiten, Wetter, Fruchtfolge und (geplant) Aufbruch-Reisen und Online-Tausch. Komplett im Code gezeichnet, keine Bilddateien.

Läuft ohne Build-Schritt (statische Dateien, ES-Module). Lokal: `python3 -m http.server`, dann `index.html` öffnen.

## Aufbau

| Datei | Inhalt |
| --- | --- |
| `js/data.js` | Pflanzen, Seltenheiten, Mutationen, Gebäude |
| `js/logic.js` | Spiellogik ohne Oberfläche (Wachstum, Wetter, Markt, Verkauf) |
| `js/art.js` | Zeichnen von Pflanzen, Feldern, Welt und Wetter |
| `js/main.js` | Oberfläche, Eingabe, Speichern |
| `test/logic.test.mjs` | Tests der Spiellogik (`node --test test`) |

## Spielregeln (Stand Stufe 1)

- Pflanzen wachsen in echter Zeit, auch offline. Jahreszeit (alle 3 Std) und Wetter (alle 20 Min) hängen nur von der Uhr ab.
- Durstige Felder wachsen halb so schnell; Regen und Schnee gießen alles.
- Jede Pflanze hat eine Lieblings-Jahreszeit (×1,3 Tempo, Gegenjahreszeit ×0,7). Das Gewächshaus schützt Reihen.
- Erde wird bei jedem Anbau müde und erholt sich auf leeren Feldern. Gleiche Pflanzenfamilie hintereinander kostet extra Fruchtbarkeit, Wechsel gibt Fruchtfolge-Bonus.
- Der Samen-Markt wechselt zur vollen Stunde und ist für alle Spieler gleich. Händler-Ruf schaltet seltenere Samen frei.
- Spielstand liegt im Browser (localStorage), im Hub mit Spielstand-Code.

## Aufbruch und Aufträge (Stufe 2)

- **Aufbruch:** Wagen schicken Reisen in 7 Gebiete (Waldrand bis Himmelsinsel, Gebiete schaltet der Ruf frei). Dauer Kurz/Mittel/Lang gegen Proviantkosten. Zurück kommen Samen (auch seltene, die der Markt nicht verkauft, teils mit Mutation) und ein Ereignis mit zwei Wegen. Die Himmelsinsel kann sehr selten geheime Pflanzen bringen. Das Wagenhaus erlaubt mehrere Reisen gleichzeitig.
- **Aufträge:** Das Dorf bestellt Ernte (teils mit Mutation) gegen mehr Geld als beim Verkauf plus Ruf; drei Bestellungen, 3 Std gültig.
