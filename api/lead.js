export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const WEBHOOK_URL =
    "https://script.google.com/macros/s/AKfycbzr7dN6DwP3FnWgnIzcFAFehEDrQQ-bpuUaJm_HydCc-CbjE5hWx8pTezERWpzYqKGq/exec";

  try {
    const payload = req.body;

    const googleResponse = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload),
      redirect: "follow"
    });

    const text = await googleResponse.text();

    if (!googleResponse.ok) {
      throw new Error(`Google respondió ${googleResponse.status}`);
    }

    return res.status(200).json({
      ok: true,
      google_status: googleResponse.status,
      google_response: text
    });

  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: error.message || "Error desconocido"
    });
  }
}


