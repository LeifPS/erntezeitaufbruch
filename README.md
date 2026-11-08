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

## Online (Stufe 3)

Cloudflare Worker (`src/worker.js`) mit D1-Datenbank (`schema.sql`), gleiche Adresse wie das Spiel (`/api/...`).

- Spielername (3–16 Zeichen, einmalig) mit geheimem Token im Spielstand; wandert mit dem Spielstand-Code.
- Hof besuchen: der Hof wird alle 90 Sekunden hochgeladen; Besucher sehen ihn (Wachstum wird weitergerechnet) und können Felder gießen. Der Besitzer bekommt das beim nächsten Abgleich (alle 20 Sekunden): Feld gegossen, etwas fruchtbarer. Besucher bekommen +1 Ruf; höchstens 3 Hilfen je Hof und 20 Minuten.
- Tauschbörse: Angebote mit bis zu 3 Gegenständen, der Tausch läuft über den Server (Angebot wird einmalig vergeben, der Anbieter bekommt die Gegenleistung per Post). Angebote zurückziehen gibt die Ware zurück.
- Der Server prüft Pflanzen, Mengen und dass die Gegenleistung zum Angebot passt, kann aber nicht prüfen, ob die Ware wirklich im Lager lag. Für ein Familienspiel gedacht, nicht gegen Betrüger gehärtet.
- Einrichtung: D1-Datenbank `erntezeitaufbruch` anlegen, `schema.sql` ausführen, `database_id` in `wrangler.jsonc` eintragen, das Repo als Worker in Cloudflare verbinden.
- Lokal testen: `npm i && npx wrangler d1 execute erntezeitaufbruch --local --file=schema.sql && npx wrangler dev --local`.
