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
    const mensaje = req.body;

    // Llamada al nuevo endpoint de OpenAI (gpt-4.1)
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CLAVE_API_DE_OPENAI}`,

      },
      body: JSON.stringify({
        model: "gpt-4.1",
        messages: [
          { role: "user", content: mensaje },
        ],
      }),
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      console.error("Error API:", data);
      return res.status(500).json({ error: "Error con OpenAI", detalle: data });
    }

    const texto = data.choices?.[0]?.message?.content || "No pude generar respuesta.";

    return res.status(200).json({ respuesta: texto });

  } catch (error) {
    console.error("Error en el servidor:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}



