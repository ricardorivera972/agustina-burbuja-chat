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

  // ⚠️ URL DEL DEPLOY NUEVO DEL APPS SCRIPT
  const WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycbz7SZ_X1DghK_INqojyaU-DGLbtx4M8odcaB7OfCy9N-5mK4aZ0sdlvlDKYSJ7PuOJI/exec";

  // =========================
  // 1. Entrada
  // =========================
  const incoming = req.body || {};

  // =========================
  // 2. Payload FINAL LIMPIO (9 CAMPOS)
  // =========================
  const payload = {
    fecha_hora: new Date().toISOString(),
    origen: incoming.origen || "Chat Agust








