export default async function handler(req, res) {
  // CORS (por si en algún momento lo llamás desde otro dominio)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycbzr7dN6DwP3FnWgnIzcFAFehEDrQQ-bpuUaJm_HydCc-CbjE5hWx8pTezERWpzYqKGq/exec";

  try {
    const payload = req.body;

    const r = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      redirect: "follow",
    });

    // Apps Script a veces responde 200 aunque no devuelva JSON válido.
    // Igual devolvemos OK si llegó.
    const text = await r.text().catch(() => "");

    return res.status(200).json({
      ok: true,
      webhook_status: r.status,
      webhook_response: text?.slice(0, 200) || "",
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Unknown error",
    });
  }
}
