// API de Certis: guarda y sincroniza registros en Netlify Blobs.
// Fusiona por id: siempre gana la versión más reciente (campo "upd").
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const pin = process.env.CERTIS_PIN;
  if (pin && req.headers.get("x-pin") !== pin) {
    return Response.json({ error: "pin" }, { status: 401 });
  }
  const store = getStore({ name: "certis-data", consistency: "strong" });
  const data = (await store.get("items", { type: "json" })) || {};

  if (req.method === "POST") {
    const body = await req.json();
    let changed = false;
    for (const it of body.items || []) {
      if (!it || !it.id) continue;
      const cur = data[it.id];
      if (!cur || (it.upd || 0) > (cur.upd || 0)) { data[it.id] = it; changed = true; }
    }
    if (changed) await store.setJSON("items", data);
  }
  return Response.json({ items: Object.values(data) });
};

export const config = { path: "/api/data" };
