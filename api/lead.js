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

  // ✅ URL NUEVA DEL APPS SCRIPT (23/12/2025)
  const WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycbxWLfX51AE9wA-L2foVwEAWnFwswbdLB0jJtzWBE4nsgeCGdK2s4gV0QD4Zx-8IOF49/exec";

  // =========================
  // 1. Entrada
  // =========================
  const incoming = req.body || {};

  // =========================
  // 2. Payload FINAL LIMPIO (10 CAMPOS)
  // =========================
  const payload = {
    origen: incoming.origen || "Chat Agustina Web",
    empresa: incoming.empresa || "",
    nombre: incoming.nombre || "",
    email: incoming.email || "",
    telefono: incoming.telefono || "",
    industria: incoming.industria || "No informado",
    comentarios: incoming.comentarios || "",
    plazo: incoming.plazo || "Sin plazo definido"
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

    if (!response.ok) {
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

    if (!parsed || parsed.ok !== true) {
      return res.status(500).json({
        ok: false,
        error: "Webhook response invalid",
        detail: text
      });
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









