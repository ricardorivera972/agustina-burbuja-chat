export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  const WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycby79cuF2hW-CWk-CFt_u7FRv_wwehD9v3Q8w5ygbZur-VrRM7B9VkBIT0pclyQJpvBo/exec";

  // ✅ Esto permite test sin formulario: abrís /api/lead?test=1
  const payload =
    req.method === "GET"
      ? {
          nombre: "TEST",
          empresa: "TEST",
          email: "test@test.com",
          telefono: "123",
          comentarios: "TEST desde /api/lead?test=1",
          resumen_chat: "- test",
          origen: "TEST API",
          fecha_hora: new Date().toISOString(),
          dispositivo: "TEST"
        }
      : req.body;

  try {
    const googleResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow"
    });

    const text = await googleResponse.text();

    // ✅ Si Google te manda HTML (login/permiso), lo detectamos y te lo mostramos
    const looksLikeHtml =
      text.trim().startsWith("<!DOCTYPE html") || text.toLowerCase().includes("<html");

    if (!googleResponse.ok) {
      return res.status(500).json({
        ok: false,
        where: "google_response_not_ok",
        status: googleResponse.status,
        text: text.slice(0, 500)
      });
    }

    if (looksLikeHtml) {
      return res.status(500).json({
        ok: false,
        where: "google_returned_html",
        status: googleResponse.status,
        text: text.slice(0, 500)
      });
    }

    // ✅ Apps Script tuyo devuelve JSON: {"ok":true} o {"ok":false,"error":"..."}
    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (_) {}

    if (!parsed || parsed.ok !== true) {
      return res.status(500).json({
        ok: false,
        where: "apps_script_not_ok",
        status: googleResponse.status,
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






