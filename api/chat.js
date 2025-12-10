// Habilitar CORS para permitir que el navegador reciba la respuesta
export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {

  // --- CORS ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Responder rápido a OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Solo permitimos POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { mensaje } = req.body;

    // Validación
    if (!mensaje) {
      return res.status(400).json({ error: "Falta el mensaje" });
    }

    // Llamada correcta a OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CLAVE_API_DE_OPENAI}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: mensaje }
        ],
        temperature: 0.7
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Error OpenAI:", data);
      return res.status(500).json({
        error: "Error al llamar a OpenAI",
        detalle: data,
      });
    }

    const texto = data.choices?.[0]?.message?.content || "No pude generar respuesta.";

    return res.status(200).json({
      respuesta: texto
    });

  } catch (error) {
    console.error("Error del servidor:", error);
    return res.status(500).json({
      error: "Error interno del servidor"
    });
  }
}
