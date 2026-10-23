import { getStore } from "@netlify/blobs";

// Stocke qui a été pris : une clé "idListe/idCadeau" par cadeau pris.
const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });

const validId = (v) => typeof v === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(v);

export default async (req) => {
  const store = getStore("liste-noel-pris");

  if (req.method === "GET") {
    const list = new URL(req.url).searchParams.get("list");
    if (!validId(list)) return json({ error: "liste invalide" }, 400);
    const { blobs } = await store.list({ prefix: list + "/" });
    return json({ taken: blobs.map((b) => b.key.slice(list.length + 1)) });
  }

  if (req.method === "POST") {
    let body;
    try { body = await req.json(); } catch { return json({ error: "json invalide" }, 400); }
    const { list, item, taken } = body || {};
    if (!validId(list) || !validId(item)) return json({ error: "identifiant invalide" }, 400);
    const key = list + "/" + item;

    if (taken) {
      // onlyIfNew : si deux personnes cliquent en même temps, une seule gagne.
      const { modified } = await store.set(key, String(Date.now()), { onlyIfNew: true });
      return json({ ok: true, already: !modified });
    }
    await store.delete(key);
    return json({ ok: true });
  }

  return json({ error: "méthode non autorisée" }, 405);
};

export const config = { path: "/api/pris" };
