export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycbzDHQfdGWd8h1jKMYxPUS5HJkLXcdoFT4lRKcTDIn16kfGdWUccb6I2uonaYZZmvijX/exec";

  // =========================
  // 1. Entrada (GET de test o POST real)
  // =========================
  const incoming =
    req.method === "GET"
      ? {
          origen: "TEST API",
          empresa: "TEST",
          nombre: "TEST",
          email: "test@test.com",
          telefono: "123",
          comentarios: "TEST desde /api/lead?test=1",
          industria: "No informado aún",
          tipo_trabajo: "No informado aún",
          plazo: "Sin plazo definido",
          resumen_chat: "Test de webhook (sin resumen)",
          dispositivo: "TEST"
        }
      : (req.body || {});

  // =========================
  // 2. Payload BLINDADO (nunca undefined)
  // =========================
  const payload = {
    origen: incoming.origen || "Chat Agustina Web",
    empresa: incoming.empresa || "",
    nombre:
      incoming.nombre ||
      incoming.nombre_contacto ||
      incoming.contacto ||
      "",
    email: incoming.email || "",
    telefono: incoming.telefono || "",
    comentarios:
      incoming.comentarios ||
      incoming.descripcion ||
      incoming.requerimiento ||
      "",
    industria:
      incoming.industria ||
      incoming.sector ||
      "No informado aún",
    tipo_trabajo:
      incoming.tipo_trabajo ||
      incoming.trabajo ||
      incoming.servicio ||
      "No informado aún",
    plazo:
      incoming.plazo ||
      incoming.plazo_estimado ||
      incoming.fecha_entrega ||
      "Sin plazo definido",
    resumen_chat:
      incoming.resumen_chat ||
      incoming.resumen ||
      "",
    dispositivo: incoming.dispositivo || ""
  };

  // =========================
  // 3. Envío a Google Apps Script
  // =========================
  try {
    const googleResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });

    const text = await googleResponse.text();

    if (!googleResponse.ok) {
      return res.status(500).json({
        ok: false,
        where: "google_response_not_ok",
        status: googleResponse.status,
        text: text.slice(0, 500)
      });
    }

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (_) {}

    if (!parsed || parsed.ok !== true) {
      return res.status(500).json({
        ok: false,
        where: "apps_script_not_ok",
        text: text.slice(0, 500)
      });
    }

    return res.status(200).json({ ok: true });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      where: "vercel_fetch_failed",
      error: error.message
    });
  }
}








