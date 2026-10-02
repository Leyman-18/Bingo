// API del bingo: guarda una sola partida en Upstash Redis (Vercel Marketplace).
// GET  /api/game            -> { state }  (público, lo leen los jugadores)
// POST /api/game            -> guarda la partida (solo anfitrión, cabecera x-host-key)
// POST /api/game?check=1    -> verifica la clave del anfitrión
const crypto = require("crypto");

// Busca las variables de Upstash con o sin prefijo (por ejemplo STORAGE_KV_REST_API_URL).
function findEnv(suffixes) {
  for (const suf of suffixes) {
    if (process.env[suf]) return process.env[suf];
  }
  for (const name of Object.keys(process.env)) {
    for (const suf of suffixes) {
      if (name.endsWith("_" + suf) && process.env[name]) return process.env[name];
    }
  }
  return undefined;
}
const URL_ = findEnv(["KV_REST_API_URL", "UPSTASH_REDIS_REST_URL"]);
const TOKEN = findEnv(["KV_REST_API_TOKEN", "UPSTASH_REDIS_REST_TOKEN"]);
const HOST_KEY = process.env.BINGO_HOST_KEY;
const KEY = "bingo:game";

async function redis(cmd) {
  const r = await fetch(URL_, {
    method: "POST",
    headers: { Authorization: "Bearer " + TOKEN, "content-type": "application/json" },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error("redis " + r.status);
  return (await r.json()).result;
}

function keyOk(given) {
  const a = crypto.createHash("sha256").update(String(given || "")).digest();
  const b = crypto.createHash("sha256").update(String(HOST_KEY)).digest();
  return crypto.timingSafeEqual(a, b);
}

function validState(s) {
  return s && typeof s === "object" && Array.isArray(s.called) && Array.isArray(s.players) &&
    Array.isArray(s.prizes) && Number.isInteger(s.seed) && Number.isInteger(s.count) &&
    s.count >= 1 && s.count <= 300 && s.called.length <= 90 && s.players.length <= 400 &&
    typeof s.title === "string" && s.title.length <= 100;
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!URL_ || !TOKEN || !HOST_KEY) {
    const falta = [!URL_ && "URL de la base", !TOKEN && "token de la base", !HOST_KEY && "BINGO_HOST_KEY"].filter(Boolean).join(", ");
    return res.status(503).json({ error: "Falta configurar: " + falta });
  }
  try {
    if (req.method === "GET") {
      const raw = await redis(["GET", KEY]);
      return res.status(200).json({ state: raw ? JSON.parse(raw) : null });
    }
    if (req.method === "POST") {
      if (!keyOk(req.headers["x-host-key"])) return res.status(401).json({ error: "Clave incorrecta" });
      if (req.query && req.query.check) return res.status(200).json({ ok: true });
      let body = req.body;
      if (typeof body === "string") body = JSON.parse(body);
      if (!validState(body)) return res.status(400).json({ error: "Datos de partida no válidos" });
      await redis(["SET", KEY, JSON.stringify(body)]);
      return res.status(200).json({ ok: true });
    }
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Método no permitido" });
  } catch (e) {
    return res.status(500).json({ error: "Error del servidor" });
  }
};
