export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { mensaje } = req.body;

    // Llamada correcta al nuevo endpoint de OpenAI
    const respuesta = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: mensaje }
        ],
      }),
    });

    const data = await respuesta.json();

    if (!respuesta.ok) {
      console.error("Error de OpenAI:", data);
      return res.status(500).json({ error: "Error en OpenAI", detalle: data });
    }

    const texto = data.choices?.[0]?.message?.content ?? "No pude generar respuesta.";

    return res.status(200).json({ respuesta: texto });

  } catch (error) {
    console.error("Error en el servidor:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}


