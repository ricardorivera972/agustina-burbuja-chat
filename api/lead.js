export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycby79cuF2hW-CWk-CFt_u7FRv_wwehD9v3Q8w5ygbZur-VrRM7B9VkBIT0pclyQJpvBo/exec";

  const incoming =
    req.method === "GET"
      ? {
          nombre: "TEST",
          empresa: "TEST",
          email: "test@test.com",
          telefono: "123",
          comentarios: "TEST desde /api/lead?test=1",
          origen: "TEST API",
          // ✅ agrego campos que te faltaban
          industria: "No informado aún",
          tipo_trabajo: "No informado aún",
          plazo: "Sin plazo definido",
          resumen_chat: "Test de webhook (sin resumen).",
          dispositivo: "TEST"
        }
      : (req.body || {});

  // ✅ Normalizo claves (por si el front manda con otros nombres)
  const payload = {
    origen: incoming.origen,
    empresa: incoming.empresa,
    nombre: incoming.nombre || incoming.nombre_contacto || incoming.contacto,
    email: incoming.email,
    telefono: incoming.telefono,
    comentarios: incoming.comentarios || incoming.descripcion || incoming.requerimiento,
    industria: incoming.industria || incoming.sector,
    tipo_trabajo: incoming.tipo_trabajo || incoming.trabajo || incoming.servicio,
    plazo: incoming.plazo || incoming.plazo_estimado || incoming.fecha_entrega,
    resumen_chat: incoming.resumen_chat || incoming.resumen || "",
    dispositivo: incoming.dispositivo
  };

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
    try { parsed = JSON.parse(text); } catch (_) {}

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








