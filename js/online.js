// Verbindung zum Worker (gleiche Adresse wie das Spiel, Pfad /api/...)
export async function api(pfad, body) {
  try {
    const r = await fetch('/api/' + pfad, { method: body ? 'POST' : 'GET', headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    const j = await r.json(); return j;
  } catch (e) { return { ok: false, grund: 'Keine Verbindung zum Server.', offline: true }; }
}
