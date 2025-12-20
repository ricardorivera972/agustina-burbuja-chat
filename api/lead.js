export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  

  // 🔴 WEBHOOK NUEVO (EL QUE ME PASASTE)
  const WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycby2KYXCITot8J6zcukccbK2C6CvgXBYhwvzamZHR_sRHOYYQ0JEFyL76MtHWnMo3UQ/exec";

  // ✅ Permite test desde navegador: /api/lead?test=1
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







