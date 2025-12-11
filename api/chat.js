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

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Mensaje no recibido" });
  }

  try {
    // Llamada a OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();

    // Validación de la respuesta
    if (!data.choices || data.choices.length === 0) {
      return res.status(500).json({ error: "Respuesta inválida de OpenAI" });
    }

    // Enviar respuesta al cliente
    return res.status(200).json({ reply: data.choices[0].message.content });

  } catch (error) {
    console.error("Error en el servidor:", error);
    return res.status(500).json({ error: "Error de servidor", details: error.message });
  }
}

