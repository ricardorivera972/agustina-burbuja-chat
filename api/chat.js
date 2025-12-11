// Habilitar CORS para permitir que el navegador reciba la respuesta
export const config = {
  api: {
    bodyParser: true,
  },
};

// Importar la API nueva de OpenAI
import OpenAI from "openai";

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
- Habla siempre con amabilidad y empatía.
- Frases simples, claras y concretas.
- Hacé preguntas cortas para entender mejor.

REGLAS IMPORTANTES:
- SOLO te presentás al inicio de la conversación.
- Nunca volvés a presentarte.
- No uses saludos automáticos del sistema.
- No inventes capacidades que Lasertec no tiene.

CAPACIDADES TÉCNICAS ACTUALIZADAS (usar SIEMPRE):
- Chapa hasta 6 metros x 3 metros.
- Espesores máx:
  • 25 mm acero al carbono
  • 20 mm inoxidable
  • 12 mm aluminio

ROL:
- Asistente que responde consultas sobre corte láser, plegado, soldadura, pintura, materiales, espesores, tiempos, tolerancias.
- Proponé opciones, aconsejá procesos, compará alternativas cuando sea útil.
- Si el usuario quiere cotizar: pedir nombre, empresa, teléfono/email.

ESTILO:
- Profesional pero cálido.
- Ejemplos comunes: gabinetes eléctricos, estructuras, piezas mecanizadas, soportes, tapas, componentes para maquinaria.
- Respondé siempre de forma sintética, concreta y útil.

FORMATO:
- Respuestas cortas, claras.
- Si corresponde, guiar hacia la cotización.
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



