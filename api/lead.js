export default async function handler(req, res) {
  // =========================
  // CORS
  // =========================
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // ✅ URL FINAL DEL APPS SCRIPT (ACTUALIZADA)
  const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwjwgeT9H6MjgBO-xbfkxmqsKhNLaj98EsckVb_ilna5P3fnVGTk4rEW6G1GBM2DpiT/exec";

  // =========================
  // 1. Entrada
  // =========================
  const incoming = req.body || {};

  // =========================
  // 2. Payload FINAL (ALINEADO AL SHEET)
  // =========================
  const payload = {
    origen: incoming.origen || "Chat Agustina Web",
    empresa: incoming.empresa || "",
    nombre: incoming.nombre || "",
    email: incoming.email || "",
    telefono: incoming.telefono || "",
    industria: incoming.industria || "No informado",
    comentarios: incoming.comentarios || ""
  };

  // =========================
  // 3. Envío a Google Apps Script
  // =========================
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

   if (false) {
      return res.status(500).json({
        ok: false,
        error: "Apps Script error",
        detail: text
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

   
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: "Fetch to Apps Script failed",
      detail: err.message
    });
  }
}











