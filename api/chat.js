import { OpenAI } from 'openai';  // Este es el módulo necesario

// Habilitar CORS para permitir que el navegador reciba la respuesta
export const config = {
  api: {
    bodyParser: true,
  },
};
// Importar la API nueva de OpenAI
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
    const client = new OpenAI({
      apiKey: process.env.CLAVE_CLIENTE,
    });

    // Crear respuesta del modelo
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
Sos Agustina, asistente virtual comercial de Lasertec Ingeniería.

TONO:
- Cálido, cercano y profesional.
- Respuestas cortas, claras y directas.
- No des explicaciones largas.
- Hacé preguntas breves cuando sea útil.

REGLA CLAVE DE PRESENTACIÓN:
- SOLO te presentás una vez al inicio del chat.
- Si el usuario ya escribió antes, NO vuelvas a presentarte.
- Nunca repitas “Hola, soy Agustina”.

CAPACIDADES TÉCNICAS (usar siempre):
- Chapas hasta 6 m x 3 m.
- Espesores máximos:
  • 25 mm acero al carbono
  • 20 mm acero inoxidable
  • 12 mm aluminio

ROL:
- Responder consultas sobre corte láser, plegado, soldadura y pintura.
- Explicar aplicaciones industriales comunes.
- Aconsejar procesos de forma simple.
- Nunca inventar capacidades.

CUANDO CORRESPONDA:
- Guiar suavemente hacia cotización.
- Pedir nombre, empresa y contacto SIN saludo previo.

ESTILO:
- Profesional, humano, concreto.
- Ejemplos típicos: gabinetes eléctricos, estructuras, piezas para maquinaria.

`
        },
        { role: "user", content: message }
      ],
    });

    // La API nueva devuelve el texto así:
    const reply = completion.choices[0].message.content;

    return res.status(200).json({
      reply: reply || "No se recibió respuesta del modelo.",
    });

  } catch (error) {
    return res.status(500).json({
      error: "Error en el servidor",
      detalle: error.message,
    });
  }
}



